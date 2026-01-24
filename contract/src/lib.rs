#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Vec,
};

#[cfg(test)]
mod test;

/// Job States
const STATE_CREATED: u32 = 0;
const STATE_FUNDED: u32 = 1;
const STATE_SUBMITTED: u32 = 2;
const STATE_APPROVED: u32 = 3;
const STATE_REJECTED: u32 = 4;
const STATE_CANCELLED: u32 = 5;

/// Storage Keys
const JOB_COUNTER: &str = "JOB_CNT";

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub initial_payment: i128,
    pub deadline: u64,
    pub description: String,
    pub state: u32,
    pub token: Address,
    pub work_submitted_at: u64,
    pub funded_at: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum EscrowError {
    JobNotFound = 1,
    Unauthorized = 2,
    InvalidState = 3,
    DeadlinePassed = 4,
    InvalidAmount = 5,
    AlreadyFunded = 6,
    NotFunded = 7,
    WorkNotSubmitted = 8,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the contract
    pub fn initialize(env: Env) {
        if env.storage().instance().has(&JOB_COUNTER) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&JOB_COUNTER, &0u64);
    }

    /// Create a new job (no funds transferred yet)
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
        initial_payment_percent: u32,
        deadline: u64,
        description: String,
        token: Address,
    ) -> Result<u64, EscrowError> {
        client.require_auth();

        // Validate inputs
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        if initial_payment_percent > 100 {
            return Err(EscrowError::InvalidAmount);
        }

        let current_time = env.ledger().timestamp();
        if deadline <= current_time {
            return Err(EscrowError::DeadlinePassed);
        }

        // Calculate initial payment
        let initial_payment = (amount * initial_payment_percent as i128) / 100;

        // Get next job ID
        let counter: u64 = env.storage().instance().get(&JOB_COUNTER).unwrap_or(0);
        let job_id = counter + 1;

        // Create job
        let job = Job {
            id: job_id,
            client: client.clone(),
            freelancer,
            amount,
            initial_payment,
            deadline,
            description,
            state: STATE_CREATED,
            token,
            work_submitted_at: 0,
            funded_at: 0,
        };

        // Store job
        env.storage().instance().set(&job_id, &job);
        env.storage().instance().set(&JOB_COUNTER, &job_id);

        Ok(job_id)
    }

    /// Client funds the escrow (locks the payment)
    pub fn fund_job(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Check state
        if job.state != STATE_CREATED {
            return Err(EscrowError::AlreadyFunded);
        }

        // Transfer tokens from client to contract
        let token_client = token::Client::new(&env, &job.token);
        let contract_address = env.current_contract_address();
        
        token_client.transfer(&job.client, &contract_address, &job.amount);

        // Update job state
        job.state = STATE_FUNDED;
        job.funded_at = env.ledger().timestamp();
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Freelancer marks work as submitted
    pub fn submit_work(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.freelancer.require_auth();

        // Check state
        if job.state != STATE_FUNDED {
            return Err(EscrowError::InvalidState);
        }

        // Check deadline
        let current_time = env.ledger().timestamp();
        if current_time > job.deadline {
            return Err(EscrowError::DeadlinePassed);
        }

        // Update state
        job.state = STATE_SUBMITTED;
        job.work_submitted_at = current_time;
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Release initial payment to freelancer (partial payment)
    pub fn release_initial_payment(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Check state - can release after work is submitted
        if job.state != STATE_SUBMITTED {
            return Err(EscrowError::WorkNotSubmitted);
        }

        if job.initial_payment <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        // Transfer initial payment to freelancer
        let token_client = token::Client::new(&env, &job.token);
        let contract_address = env.current_contract_address();
        
        token_client.transfer(&contract_address, &job.freelancer, &job.initial_payment);

        // Keep state as SUBMITTED (waiting for final approval/rejection)
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Client approves work and releases remaining funds to freelancer
    pub fn approve_job(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Check state
        if job.state != STATE_SUBMITTED {
            return Err(EscrowError::InvalidState);
        }

        let token_client = token::Client::new(&env, &job.token);
        let contract_address = env.current_contract_address();
        
        // Calculate remaining payment
        let remaining_payment = job.amount - job.initial_payment;
        
        if remaining_payment > 0 {
            // Transfer remaining funds to freelancer
            token_client.transfer(&contract_address, &job.freelancer, &remaining_payment);
        }

        // Update state
        job.state = STATE_APPROVED;
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Client rejects work and gets full refund
    pub fn reject_job(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Check state
        if job.state != STATE_SUBMITTED {
            return Err(EscrowError::InvalidState);
        }

        let token_client = token::Client::new(&env, &job.token);
        let contract_address = env.current_contract_address();
        
        // Calculate refund amount (total - initial payment already released)
        let refund_amount = job.amount - job.initial_payment;
        
        if refund_amount > 0 {
            // Refund remaining funds to client
            token_client.transfer(&contract_address, &job.client, &refund_amount);
        }

        // Update state
        job.state = STATE_REJECTED;
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Cancel job before funding (no money involved)
    pub fn cancel_job(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Can only cancel if not funded yet
        if job.state != STATE_CREATED {
            return Err(EscrowError::InvalidState);
        }

        let mut updated_job = job.clone();
        updated_job.state = STATE_CANCELLED;
        env.storage().instance().set(&job_id, &updated_job);

        Ok(true)
    }

    /// Refund job if deadline passed and work not submitted
    pub fn refund_expired_job(env: Env, job_id: u64) -> Result<bool, EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Check state - must be funded but not submitted
        if job.state != STATE_FUNDED {
            return Err(EscrowError::InvalidState);
        }

        // Check deadline
        let current_time = env.ledger().timestamp();
        if current_time <= job.deadline {
            return Err(EscrowError::DeadlinePassed);
        }

        let token_client = token::Client::new(&env, &job.token);
        let contract_address = env.current_contract_address();
        
        // Refund full amount to client
        token_client.transfer(&contract_address, &job.client, &job.amount);

        // Update state
        job.state = STATE_REJECTED;
        env.storage().instance().set(&job_id, &job);

        Ok(true)
    }

    /// Get job details
    pub fn get_job(env: Env, job_id: u64) -> Result<Job, EscrowError> {
        env.storage()
            .instance()
            .get(&job_id)
            .ok_or(EscrowError::JobNotFound)
    }

    /// Get all job IDs
    pub fn get_job_count(env: Env) -> u64 {
        env.storage().instance().get(&JOB_COUNTER).unwrap_or(0)
    }

    /// Get jobs by client
    pub fn get_client_jobs(env: Env, client: Address) -> Vec<u64> {
        let counter: u64 = env.storage().instance().get(&JOB_COUNTER).unwrap_or(0);
        let mut jobs = Vec::new(&env);

        for i in 1..=counter {
            if let Some(job) = env.storage().instance().get::<u64, Job>(&i) {
                if job.client == client {
                    jobs.push_back(i);
                }
            }
        }

        jobs
    }

    /// Get jobs by freelancer
    pub fn get_freelancer_jobs(env: Env, freelancer: Address) -> Vec<u64> {
        let counter: u64 = env.storage().instance().get(&JOB_COUNTER).unwrap_or(0);
        let mut jobs = Vec::new(&env);

        for i in 1..=counter {
            if let Some(job) = env.storage().instance().get::<u64, Job>(&i) {
                if job.freelancer == freelancer {
                    jobs.push_back(i);
                }
            }
        }

        jobs
    }

    /// Get contract balance for a specific token
    pub fn get_contract_balance(env: Env, token: Address) -> i128 {
        let token_client = token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();
        token_client.balance(&contract_address)
    }
}
