CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  hash_rate DECIMAL(12,6) NOT NULL,
  power_consumption DECIMAL(10,3) NOT NULL,
  electricity_rate DECIMAL(8,6) NOT NULL,
  hardware_cost DECIMAL(15,2) NOT NULL,
  setup_cost DECIMAL(12,2) DEFAULT 0,
  maintenance_cost DECIMAL(10,2) DEFAULT 0,
  hardware_type VARCHAR(100),
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  btc_price_usd DECIMAL(12,2) NOT NULL,
  network_hash_rate_ehs DECIMAL(15,6) NOT NULL,
  difficulty BIGINT NOT NULL,
  block_reward DECIMAL(10,8) DEFAULT 3.125,
  price_source VARCHAR(50) NOT NULL,
  hash_rate_source VARCHAR(50) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parameters_hash VARCHAR(64) NOT NULL UNIQUE,
  results JSONB NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS operations_set_updated_at ON operations;
CREATE TRIGGER operations_set_updated_at
BEFORE UPDATE ON operations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_hardware_type ON operations (hardware_type);

CREATE INDEX IF NOT EXISTS idx_market_data_fetched_at ON market_data_cache (fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculation_cache_hash ON calculation_cache (parameters_hash);
CREATE INDEX IF NOT EXISTS idx_calculation_cache_expires ON calculation_cache (expires_at);

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  DELETE FROM market_data_cache
  WHERE fetched_at < NOW() - INTERVAL '7 days';

  DELETE FROM calculation_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
