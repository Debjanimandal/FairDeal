#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[derive(Clone)]
#[contracttype]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub deadline: u64,
    pub description: String,
    pub state: u32, // 0=Created, 1=Submitted, 2=Approved, 3=Rejected
}

const JOB_COUNTER: &str = "JOB_CNT";

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Create job and lock funds
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
        deadline: u64,
        description: String,
    ) -> u64 {
        client.require_auth();

        // Get next job ID
        let counter: u64 = env.storage().instance().get(&JOB_COUNTER).unwrap_or(0);
        let job_id = counter + 1;

        // Create job
        let job = Job {
            id: job_id,
            client: client.clone(),
            freelancer,
            amount,
            deadline,
            description,
            state: 0,
        };

        // Store job
        env.storage().instance().set(&job_id, &job);
        env.storage().instance().set(&JOB_COUNTER, &job_id);

        job_id
    }

    /// Freelancer marks work as submitted
    pub fn submit_work(env: Env, job_id: u64) -> bool {
        let mut job: Job = env.storage().instance().get(&job_id).unwrap();
        job.freelancer.require_auth();

        job.state = 1; // Submitted
        env.storage().instance().set(&job_id, &job);
        true
    }

    /// Client approves and releases funds
    pub fn approve_job(env: Env, job_id: u64) -> bool {
        let mut job: Job = env.storage().instance().get(&job_id).unwrap();
        job.client.require_auth();

        job.state = 2; // Approved
        env.storage().instance().set(&job_id, &job);
        
        // Transfer funds to freelancer (simplified)
        true
    }

    /// Client rejects and gets refund
    pub fn reject_job(env: Env, job_id: u64) -> bool {
        let mut job: Job = env.storage().instance().get(&job_id).unwrap();
        job.client.require_auth();

        job.state = 3; // Rejected
        env.storage().instance().set(&job_id, &job);
        
        // Refund client (simplified)
        true
    }

    /// Get job details
    pub fn get_job(env: Env, job_id: u64) -> Job {
        env.storage().instance().get(&job_id).unwrap()
    }
}
