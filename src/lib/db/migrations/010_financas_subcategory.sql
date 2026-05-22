-- Add subcategory column to financial_transactions
ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS subcategory TEXT;
