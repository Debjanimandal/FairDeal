#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec, FromVal, IntoVal, TryFromVal, Val};

// Error codes
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    JobNotFound = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
    InvalidDeadline = 4,
    JobAlreadySubmitted = 5,
    JobNotSubmitted = 6,
    JobAlreadyCompleted = 7,
    DeadlineNotPassed = 8,
    InvalidJob = 9,
}

impl TryFromVal<Env, Val> for EscrowError {
    type Error = soroban_sdk::contracterror::ConversionError;
    fn try_from_val(_env: &Env, _val: &Val) -> Result<Self, Self::Error> {
        Err(soroban_sdk::contracterror::ConversionError)
    }
}

impl From<EscrowError> for soroban_sdk::contracterror::Error {
    fn from(e: EscrowError) -> Self {
        soroban_sdk::contracterror::Error::from_type_and_code(
            soroban_sdk::contracterror::ErrorType::Contract,
            e as u32,
        )
    }
}

// Job states
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum JobState {
    Created = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
    Refunded = 4,
}

impl TryFromVal<Env, Val> for JobState {
    type Error = soroban_sdk::contracterror::ConversionError;
    fn try_from_val(_env: &Env, _val: &Val) -> Result<Self, Self::Error> {
        Err(soroban_sdk::contracterror::ConversionError)
    }
}

impl From<JobState> for Val {
    fn from(e: JobState) -> Self {
        Val::from_val(&(e as u32, ))
    }
}

// Job struct
#[derive(Clone)]
#[contracttype]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub deadline: u64,
    pub description: String,
    pub state: u32, // 0=Created, 1=Submitted, 2=Approved, 3=Rejected, 4=Refunded
    pub created_at: u64,
    pub submitted_at: u64,
    pub completed_at: u64,
    pub initial_payment_percent: u32, // Percentage paid upfront (e.g., 10 for 10%)
    pub initial_payment_released: bool, // Track if initial payment was sent
    pub fraud_flag_raised: bool, // Track if client raised fraud flag
    pub fraud_flag_timestamp: u64, // When fraud flag was raised
}

// Contract data keys
const JOB_PREFIX: Symbol = symbol_short!("job");
const JOB_COUNTER: Symbol = symbol_short!("cnt");
const TOKEN: Symbol = symbol_short!("tok");

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    /// Initialize the contract with a token (native USDC or similar)
    pub fn init(env: Env, token: Address) {
        token.require_auth();
        env.storage().instance().set(&TOKEN, &token);
    }

    /// Create a new job
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
        deadline: u64,
        description: String,
        initial_payment_percent: u32,
    ) -> Result<u64, EscrowError> {
        client.require_auth();

        // Validation
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(EscrowError::InvalidDeadline);
        }
        if initial_payment_percent > 100 {
            return Err(EscrowError::InvalidAmount);
        }

        // Get next job ID
        let counter: u64 = env
            .storage()
            .instance()
            .get(&JOB_COUNTER)
            .unwrap_or(Ok(0))
            .unwrap_or(0);
        let job_id = counter + 1;

        // Create job
        let job = Job {
            id: job_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            amount,
            deadline,
            description,
            state: 0, // Created
            created_at: env.ledger().timestamp(),
            submitted_at: 0,
            completed_at: 0,
            initial_payment_percent,
            initial_payment_released: false,
            fraud_flag_raised: false,
            fraud_flag_timestamp: 0,
        };

        // Store job
        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);
        env.storage().instance().set(&JOB_COUNTER, &job_id);

        Ok(job_id)
    }

    /// Deposit funds into escrow (locks the funds)
    pub fn deposit_funds(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.client.require_auth();

        if job.state != 0 {
            return Err(EscrowError::JobAlreadyCompleted);
        }

        // Transfer funds from client to contract
        let token: Address = env
            .storage()
            .instance()
            .get(&TOKEN)
            .ok_or(EscrowError::InvalidJob)?
            .map_err(|_| EscrowError::InvalidJob)?;

        // Simulate token transfer (in production, call token contract)
        // For MVP: we trust the client has locked funds
        // In real implementation: call soroban_sdk's token transfer functions

        Ok(())
    }

    /// Mark job as submitted (freelancer calls this)
    pub fn mark_submitted(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.freelancer.require_auth();

        if job.state != 0 {
            return Err(EscrowError::JobAlreadySubmitted);
        }

        job.state = 1; // Submitted
        job.submitted_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        Ok(())
    }

    /// Approve job and release funds (client calls this)
    pub fn approve_job(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.client.require_auth();

        if job.state != 1 {
            return Err(EscrowError::JobNotSubmitted);
        }

        job.state = 2; // Approved
        job.completed_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        // Calculate remaining amount (total - initial payment already sent)
        let remaining_amount = if job.initial_payment_released {
            job.amount - (job.amount * job.initial_payment_percent as i128) / 100
        } else {
            job.amount // If initial payment wasn't released, release full amount
        };

        // Transfer remaining funds to freelancer (simulated)
        // In production: call token contract transfer
        // token.transfer(contract, freelancer, remaining_amount)

        Ok(())
    }

    /// Reject job and refund client (client calls this)
    pub fn reject_job(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.client.require_auth();

        if job.state != 1 {
            return Err(EscrowError::JobNotSubmitted);
        }

        job.state = 3; // Rejected
        job.completed_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        // Calculate refund amount (total - initial payment already sent to freelancer)
        let refund_amount = if job.initial_payment_released {
            job.amount - (job.amount * job.initial_payment_percent as i128) / 100
        } else {
            job.amount // If initial payment wasn't released, refund full amount
        };

        // Transfer remaining funds back to client (simulated)
        // In production: call token contract transfer
        // Note: Freelancer keeps the initial payment even on rejection

        Ok(())
    }

    /// Refund after deadline passes (anyone can call this)
    pub fn refund_after_deadline(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        if env.ledger().timestamp() <= job.deadline {
            return Err(EscrowError::DeadlineNotPassed);
        }

        if job.state != 1 && job.state != 0 {
            return Err(EscrowError::JobAlreadyCompleted);
        }

        job.state = 4; // Refunded
        job.completed_at = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        // Transfer funds back to client (simulated)

        Ok(())
    }

    /// Release initial payment to freelancer (partial payment)
    pub fn release_initial_payment(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.client.require_auth();

        if job.state != 0 {
            return Err(EscrowError::JobAlreadyCompleted);
        }

        if job.initial_payment_released {
            return Err(EscrowError::JobAlreadyCompleted);
        }

        // Calculate initial payment amount
        let initial_amount = (job.amount * job.initial_payment_percent as i128) / 100;

        // Mark as released
        job.initial_payment_released = true;

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        // Transfer initial payment to freelancer (simulated)
        // In production: call token contract transfer to freelancer
        // token.transfer(contract, freelancer, initial_amount)

        Ok(())
    }

    /// Raise fraud flag on freelancer (client calls when freelancer doesn't deliver)
    pub fn raise_fraud_flag(env: Env, job_id: u64) -> Result<(), EscrowError> {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)?;

        job.client.require_auth();

        // Can only raise fraud flag if payment was released but work not submitted
        if !job.initial_payment_released {
            return Err(EscrowError::Unauthorized);
        }

        if job.state != 0 {
            return Err(EscrowError::JobAlreadySubmitted);
        }

        if job.fraud_flag_raised {
            return Err(EscrowError::JobAlreadyCompleted);
        }

        // Set fraud flag
        job.fraud_flag_raised = true;
        job.fraud_flag_timestamp = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&(JOB_PREFIX, job_id), &job);

        Ok(())
    }

    /// Get fraud flag count for a freelancer
    pub fn get_freelancer_fraud_count(env: Env, freelancer: Address) -> u32 {
        let job_count: u64 = env
            .storage()
            .instance()
            .get(&JOB_COUNTER)
            .unwrap_or(Ok(0))
            .unwrap_or(0);

        let mut fraud_count = 0u32;

        for job_id in 1..=job_count {
            if let Ok(job) = env
                .storage()
                .instance()
                .get::<(Symbol, u64), Job>(&(JOB_PREFIX, job_id))
                .ok_or(EscrowError::JobNotFound)
            {
                if let Ok(job) = job {
                    if job.freelancer == freelancer && job.fraud_flag_raised {
                        fraud_count += 1;
                    }
                }
            }
        }

        fraud_count
    }

    /// Get job details
    pub fn get_job(env: Env, job_id: u64) -> Result<Job, EscrowError> {
        env.storage()
            .instance()
            .get(&(JOB_PREFIX, job_id))
            .ok_or(EscrowError::JobNotFound)?
            .map_err(|_| EscrowError::JobNotFound)
    }

    /// Get total jobs created
    pub fn job_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&JOB_COUNTER)
            .unwrap_or(Ok(0))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::arbitrary::std;

    #[test]
    fn test_create_job() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Escrow);
        let client = soroban_sdk::Address::generate(&env);
        let freelancer = soroban_sdk::Address::generate(&env);
        let token = soroban_sdk::Address::generate(&env);

        let client_contract = Client::new(&env, &contract_id);

        // Initialize
        client_contract.init(&token);

        // Create job
        let result = client_contract.create_job(
            &client,
            &freelancer,
            &100_000_000i128,
            &(env.ledger().timestamp() + 86400),
            &"Build a website".into(),
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_invalid_amount() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Escrow);
        let client = soroban_sdk::Address::generate(&env);
        let freelancer = soroban_sdk::Address::generate(&env);
        let token = soroban_sdk::Address::generate(&env);

        let client_contract = Client::new(&env, &contract_id);
        client_contract.init(&token);

        let result = client_contract.create_job(
            &client,
            &freelancer,
            &0i128,
            &(env.ledger().timestamp() + 86400),
            &"Build a website".into(),
        );

        assert!(result.is_err());
    }
}
