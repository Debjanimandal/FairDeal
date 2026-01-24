#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    token, Address, Env, IntoVal, Symbol,
};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, token::Client<'a>) {
    let contract_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(env, &contract_address);
    (contract_address, token_client)
}

#[test]
fn test_create_and_fund_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);

    // Mint tokens to client
    token.mint(&client_addr, &10000);

    // Initialize contract
    client.initialize();

    // Create job
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20, // 20% initial payment
        &(env.ledger().timestamp() + 86400), // 1 day deadline
        &String::from_str(&env, "Test Job"),
        &token_address,
    );

    assert_eq!(job_id, 1);

    // Fund job
    let result = client.fund_job(&job_id);
    assert_eq!(result, Ok(true));

    // Check contract received tokens
    let contract_balance = token.balance(&contract_id);
    assert_eq!(contract_balance, 1000);

    // Check client balance reduced
    let client_balance = token.balance(&client_addr);
    assert_eq!(client_balance, 9000);

    // Check job state
    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_FUNDED);
}

#[test]
fn test_submit_work_and_approve() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);
    token.mint(&client_addr, &10000);

    client.initialize();

    // Create and fund job
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &(env.ledger().timestamp() + 86400),
        &String::from_str(&env, "Test Job"),
        &token_address,
    );
    client.fund_job(&job_id);

    // Submit work
    let submit_result = client.submit_work(&job_id);
    assert_eq!(submit_result, Ok(true));

    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_SUBMITTED);

    // Approve job
    let approve_result = client.approve_job(&job_id);
    assert_eq!(approve_result, Ok(true));

    // Check freelancer received full payment
    let freelancer_balance = token.balance(&freelancer_addr);
    assert_eq!(freelancer_balance, 1000);

    // Check contract balance is zero
    let contract_balance = token.balance(&contract_id);
    assert_eq!(contract_balance, 0);

    // Check job state
    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_APPROVED);
}

#[test]
fn test_submit_work_and_reject() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);
    token.mint(&client_addr, &10000);

    client.initialize();

    // Create and fund job
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &(env.ledger().timestamp() + 86400),
        &String::from_str(&env, "Test Job"),
        &token_address,
    );
    client.fund_job(&job_id);

    // Submit work
    client.submit_work(&job_id);

    // Reject job
    let reject_result = client.reject_job(&job_id);
    assert_eq!(reject_result, Ok(true));

    // Check client received refund (full amount since no initial payment released)
    let client_balance = token.balance(&client_addr);
    assert_eq!(client_balance, 9000 + 1000); // Initial 9000 + 1000 refund

    // Check freelancer received nothing
    let freelancer_balance = token.balance(&freelancer_addr);
    assert_eq!(freelancer_balance, 0);

    // Check job state
    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_REJECTED);
}

#[test]
fn test_initial_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);
    token.mint(&client_addr, &10000);

    client.initialize();

    // Create and fund job with 20% initial payment
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &(env.ledger().timestamp() + 86400),
        &String::from_str(&env, "Test Job"),
        &token_address,
    );
    client.fund_job(&job_id);
    client.submit_work(&job_id);

    // Release initial payment
    let initial_result = client.release_initial_payment(&job_id);
    assert_eq!(initial_result, Ok(true));

    // Check freelancer received 20% (200 tokens)
    let freelancer_balance = token.balance(&freelancer_addr);
    assert_eq!(freelancer_balance, 200);

    // Approve job to release remaining 80% (800 tokens)
    client.approve_job(&job_id);

    // Check freelancer received full payment
    let freelancer_balance = token.balance(&freelancer_addr);
    assert_eq!(freelancer_balance, 1000);
}

#[test]
fn test_refund_expired_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);
    token.mint(&client_addr, &10000);

    client.initialize();

    // Create and fund job with short deadline
    let deadline = env.ledger().timestamp() + 100;
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &deadline,
        &String::from_str(&env, "Test Job"),
        &token_address,
    );
    client.fund_job(&job_id);

    // Move time forward past deadline
    env.ledger().with_mut(|li| li.timestamp = deadline + 1);

    // Refund expired job
    let refund_result = client.refund_expired_job(&job_id);
    assert_eq!(refund_result, Ok(true));

    // Check client received full refund
    let client_balance = token.balance(&client_addr);
    assert_eq!(client_balance, 10000);

    // Check job state
    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_REJECTED);
}

#[test]
fn test_cancel_unfunded_job() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, _token) = create_token_contract(&env, &token_admin);

    client.initialize();

    // Create job but don't fund it
    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &(env.ledger().timestamp() + 86400),
        &String::from_str(&env, "Test Job"),
        &token_address,
    );

    // Cancel job
    let cancel_result = client.cancel_job(&job_id);
    assert_eq!(cancel_result, Ok(true));

    // Check job state
    let job = client.get_job(&job_id).unwrap();
    assert_eq!(job.state, STATE_CANCELLED);
}

#[test]
#[should_panic]
fn test_cannot_fund_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let client = EscrowContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let freelancer_addr = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_address, token) = create_token_contract(&env, &token_admin);
    token.mint(&client_addr, &20000);

    client.initialize();

    let job_id = client.create_job(
        &client_addr,
        &freelancer_addr,
        &1000,
        &20,
        &(env.ledger().timestamp() + 86400),
        &String::from_str(&env, "Test Job"),
        &token_address,
    );

    client.fund_job(&job_id);
    // Should panic on second funding attempt
    client.fund_job(&job_id);
}
