-- Demo data so every Phase-1 flow is testable via Swagger right after first start
-- (README §13): user demo / password123 / PIN 123456, two accounts with a consistent
-- ledger, one past transfer to "Budi" and the matching saved beneficiary — which also
-- gives the Phase-2 assistant something to resolve ("transfer ke Budi ...").
--
-- pgcrypto's crypt(..., gen_salt('bf', 10)) produces $2a$ bcrypt hashes that
-- Spring's BCryptPasswordEncoder verifies as-is.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, username, password_hash, pin_hash, full_name)
VALUES ('11111111-1111-1111-1111-111111111111', 'demo',
        crypt('password123', gen_salt('bf', 10)),
        crypt('123456', gen_salt('bf', 10)),
        'Andi Pratama');

INSERT INTO accounts (id, user_id, account_number, account_type, balance, created_at)
VALUES ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111',
        '8801234567890', 'SAVINGS', 12497500.00, now() - interval '30 days'),
       ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111',
        '8809876543210', 'PAYROLL', 8750000.00, now() - interval '30 days');

-- Savings ledger: 15.000.000 deposit, then a BI-FAST transfer of 2.500.000 + 2.500 fee.
-- balance_after chains to the account balance above (12.497.500).
INSERT INTO transactions (id, account_id, direction, amount, fee, category, ref_no, description, balance_after, created_at)
VALUES ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201',
        'CREDIT', 15000000.00, 0, 'TRANSFER', 'TRX202606190001',
        'Incoming transfer - initial deposit', 15000000.00, now() - interval '30 days'),
       ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201',
        'DEBIT', 2500000.00, 2500.00, 'TRANSFER', 'TRX202607050002',
        'Transfer to BUDI SETIAWAN (BCA 1234567890)', 12497500.00, now() - interval '14 days');

-- Payroll ledger: one salary credit.
INSERT INTO transactions (id, account_id, direction, amount, fee, category, ref_no, description, balance_after, created_at)
VALUES ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202',
        'CREDIT', 8750000.00, 0, 'TRANSFER', 'TRX202606250003',
        'Salary credit JUN 2026', 8750000.00, now() - interval '24 days');

INSERT INTO transfers (id, transaction_id, method, dest_bank_code, dest_account_number, dest_account_name, note)
VALUES ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333302',
        'BI_FAST', 'BCA', '1234567890', 'BUDI SETIAWAN', 'Bayar patungan');

-- Saveable because the transfer above exists (README §5.5); alias is what the
-- assistant matches ("transfer ke Budi 15.000").
INSERT INTO beneficiaries (id, user_id, alias, bank_code, account_number, account_name)
VALUES ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111',
        'Budi', 'BCA', '1234567890', 'BUDI SETIAWAN');
