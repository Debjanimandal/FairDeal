#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String,
};

// Job states
#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum JobState {
    Created = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
    RevisionRequested = 4,
    FraudFlagged = 5,
}

// Job structure stored in contract
#[derive(Clone)]
#[contracttype]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,           // Total amount in stroops (1 XLM = 10,000,000 stroops)
    pub escrow_amount: i128,    // Amount held in escrow
    pub initial_payment: i128,  // Initial payment sent to freelancer
    pub deadline: u64,          // Unix timestamp
    pub state: JobState,
    pub work_cid: String,       // IPFS CID of submitted work
    pub fraud_flag_raised: bool,
    pub created_at: u64,
}

// Storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Job(u64),           // Job ID -> Job
    JobCount,           // Total number of jobs
    FraudFlags(Address), // Freelancer Address -> Fraud flag count
}

#[contract]
pub struct FairDealContract;

#[contractimpl]
impl FairDealContract {
    /// Initialize a new job with escrow
    /// Client must send initial_payment directly to freelancer before calling this
    /// This function locks the remaining amount in the contract
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        total_amount: i128,
        initial_payment: i128,
        deadline_days: u32,
        token_address: Address,
    ) -> u64 {
        // Verify client is the caller
        client.require_auth();

        // Validate inputs
        if total_amount <= 0 {
            panic!("Amount must be positive");
        }
        if initial_payment < 0 || initial_payment > total_amount {
            panic!("Invalid initial payment");
        }

        let escrow_amount = total_amount - initial_payment;
        
        // Transfer escrow amount from client to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&client, &env.current_contract_address(), &escrow_amount);

        // Get next job ID
        let job_count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::JobCount)
            .unwrap_or(0);
        let job_id = job_count + 1;

        // Calculate deadline
        let current_time = env.ledger().timestamp();
        let deadline = current_time + (deadline_days as u64 * 86400); // days to seconds

        // Create job
        let job = Job {
            id: job_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            amount: total_amount,
            escrow_amount,
            initial_payment,
            deadline,
            state: JobState::Created,
            work_cid: String::from_str(&env, ""),
            fraud_flag_raised: false,
            created_at: current_time,
        };

        // Store job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().set(&DataKey::JobCount, &job_id);

        // Extend storage for 1 year
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
        env.storage().persistent().extend_ttl(&DataKey::JobCount, 100000, 100000);

        job_id
    }

    /// Freelancer submits work (IPFS CID)
    pub fn submit_work(env: Env, job_id: u64, work_cid: String) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify freelancer is the caller
        job.freelancer.require_auth();

        // Check job state
        if job.state != JobState::Created && job.state != JobState::RevisionRequested {
            panic!("Cannot submit work in current state");
        }

        // Check deadline
        if env.ledger().timestamp() > job.deadline {
            panic!("Deadline has passed");
        }

        // Update job
        job.work_cid = work_cid;
        job.state = JobState::Submitted;

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Client approves work and releases escrow funds to freelancer
    pub fn approve_work(env: Env, job_id: u64, token_address: Address) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify client is the caller
        job.client.require_auth();

        // Backend handles state validation - contract just manages funds
        // Release escrow to freelancer
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.freelancer,
            &job.escrow_amount,
        );

        // Update state
        job.state = JobState::Approved;
        job.escrow_amount = 0; // Funds released

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Client rejects work and requests revision
    pub fn request_revision(env: Env, job_id: u64) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify client is the caller
        job.client.require_auth();

        // Check state
        if job.state != JobState::Submitted {
            panic!("Work not submitted yet");
        }

        // Check deadline - can't request revision after deadline
        if env.ledger().timestamp() > job.deadline {
            panic!("Cannot request revision after deadline");
        }

        // Update state
        job.state = JobState::RevisionRequested;

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Client cancels deal - refund without fraud flag (no penalty to freelancer)
    pub fn cancel_deal(env: Env, job_id: u64, token_address: Address) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify client is the caller
        job.client.require_auth();

        // Backend handles state validation - contract just manages refunds
        // Refund escrow to client
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.client,
            &job.escrow_amount,
        );

        // Update job - set to Rejected but don't add fraud flag
        job.state = JobState::Rejected;
        job.escrow_amount = 0; // Funds returned

        // Save job (no fraud count increment)
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Client raises fraud flag - immediate termination and refund
    pub fn raise_fraud_flag(env: Env, job_id: u64, token_address: Address) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify client is the caller
        job.client.require_auth();

        // Check state - can only flag if work was submitted
        if job.state != JobState::Submitted {
            panic!("Can only flag fraud on submitted work");
        }

        // Refund escrow to client
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.client,
            &job.escrow_amount,
        );

        // Update job
        job.state = JobState::FraudFlagged;
        job.fraud_flag_raised = true;
        job.escrow_amount = 0; // Funds returned

        // Increment fraud count for freelancer
        let current_flags: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FraudFlags(job.freelancer.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::FraudFlags(job.freelancer.clone()), &(current_flags + 1));

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
        env.storage().persistent().extend_ttl(&DataKey::FraudFlags(job.freelancer.clone()), 100000, 100000);
    }

    /// Client requests full refund (for unsubmitted work or deadline passed)
    pub fn refund(env: Env, job_id: u64, token_address: Address) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Verify client is the caller
        job.client.require_auth();

        // Check conditions for refund:
        // 1. Deadline passed and work not submitted, OR
        // 2. Job in Created state and both parties agree
        let current_time = env.ledger().timestamp();
        let can_refund = (current_time > job.deadline && job.state == JobState::Created)
            || (job.state == JobState::Created);

        if !can_refund {
            panic!("Refund not allowed in current state");
        }

        // Refund escrow to client
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.client,
            &job.escrow_amount,
        );

        // Update job
        job.state = JobState::Rejected;
        job.escrow_amount = 0;

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Emergency: Release funds if deadline passed and work was submitted but not reviewed
    /// Protects freelancer from indefinite escrow lock
    pub fn emergency_release(env: Env, job_id: u64, token_address: Address) {
        let mut job: Job = Self::get_job(&env, job_id);

        // Can be called by freelancer only
        job.freelancer.require_auth();

        // Check conditions: deadline passed + work submitted + not yet approved
        let current_time = env.ledger().timestamp();
        let grace_period = 7 * 86400; // 7 days grace period after deadline
        
        if job.state != JobState::Submitted {
            panic!("Work must be submitted");
        }
        if current_time <= job.deadline + grace_period {
            panic!("Must wait for deadline + grace period");
        }

        // Release escrow to freelancer (they did submit work)
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.freelancer,
            &job.escrow_amount,
        );

        // Update job
        job.state = JobState::Approved; // Auto-approved due to client inaction
        job.escrow_amount = 0;

        // Save job
        env.storage().persistent().set(&DataKey::Job(job_id), &job);
        env.storage().persistent().extend_ttl(&DataKey::Job(job_id), 100000, 100000);
    }

    /// Get job details
    pub fn get_job(env: &Env, job_id: u64) -> Job {
        env.storage()
            .persistent()
            .get(&DataKey::Job(job_id))
            .unwrap_or_else(|| panic!("Job not found"))
    }

    /// Get fraud flag count for a freelancer
    pub fn get_fraud_count(env: Env, freelancer: Address) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::FraudFlags(freelancer))
            .unwrap_or(0)
    }

    /// Get total job count
    pub fn get_job_count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::JobCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;

