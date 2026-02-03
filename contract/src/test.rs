#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FairDealContract);
    let client = FairDealContract::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);

    // Create job with 10 XLM total, 2 XLM initial payment
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &100_000_000, // 10 XLM in stroops
        &20_000_000,  // 2 XLM initial payment
        &7,           // 7 days deadline
        &token_addr,
    );

    assert_eq!(job_id, 1);

    let job = client.get_job(&job_id);
    assert_eq!(job.client, client_addr);
    assert_eq!(job.freelancer, freelancer_addr);
    assert_eq!(job.amount, 100_000_000);
    assert_eq!(job.escrow_amount, 80_000_000); // 8 XLM in escrow
    assert_eq!(job.state, JobState::Created);
}

#[test]
fn test_submit_work() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FairDealContract);
    let client = FairDealContract::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &100_000_000,
        &20_000_000,
        &7,
        &token_addr,
    );

    // Submit work
    let work_cid = String::from_str(&env, "QmTest123");
    client.submit_work(&job_id, &work_cid);

    let job = client.get_job(&job_id);
    assert_eq!(job.state, JobState::Submitted);
    assert_eq!(job.work_cid, work_cid);
}

#[test]
fn test_approve_work() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FairDealContract);
    let client = FairDealContract::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &100_000_000,
        &20_000_000,
        &7,
        &token_addr,
    );

    // Submit work
    client.submit_work(&job_id, &String::from_str(&env, "QmTest123"));

    // Approve work
    client.approve_work(&job_id, &token_addr);

    let job = client.get_job(&job_id);
    assert_eq!(job.state, JobState::Approved);
    assert_eq!(job.escrow_amount, 0); // Funds released
}

#[test]
fn test_fraud_flag() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FairDealContract);
    let client = FairDealContract::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &100_000_000,
        &20_000_000,
        &7,
        &token_addr,
    );

    // Submit work
    client.submit_work(&job_id, &String::from_str(&env, "QmTest123"));

    // Raise fraud flag
    client.raise_fraud_flag(&job_id, &token_addr);

    let job = client.get_job(&job_id);
    assert_eq!(job.state, JobState::FraudFlagged);
    assert_eq!(job.fraud_flag_raised, true);
    assert_eq!(job.escrow_amount, 0); // Refunded to client

    // Check fraud count
    let fraud_count = client.get_fraud_count(&freelancer_addr);
    assert_eq!(fraud_count, 1);
}

#[test]
fn test_request_revision() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, FairDealContract);
    let client = FairDealContract::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_addr = Address::generate(&env);

    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &100_000_000,
        &20_000_000,
        &7,
        &token_addr,
    );

    // Submit work
    client.submit_work(&job_id, &String::from_str(&env, "QmTest123"));

    // Request revision
    client.request_revision(&job_id);

    let job = client.get_job(&job_id);
    assert_eq!(job.state, JobState::RevisionRequested);
    assert_eq!(job.escrow_amount, 80_000_000); // Escrow still locked
}
