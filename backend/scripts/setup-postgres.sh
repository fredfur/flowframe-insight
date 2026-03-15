#!/bin/bash
# Script para instalar e configurar PostgreSQL para o FlowVision API.
# Executa no terminal: bash scripts/setup-postgres.sh
# (vai pedir a palavra-passe de sudo)

set -e

echo "=== 1. Instalar PostgreSQL ==="
sudo apt-get update -qq
sudo apt-get install -y postgresql postgresql-contrib

echo "=== 2. Iniciar o serviço ==="
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "=== 3. Criar utilizador e base de dados flowvision ==="
sudo -u postgres psql -v ON_ERROR_STOP=0 << 'EOSQL'
CREATE USER flowvision WITH PASSWORD 'flowvision';
CREATE DATABASE flowvision OWNER flowvision;
GRANT ALL PRIVILEGES ON DATABASE flowvision TO flowvision;
\connect flowvision
GRANT ALL ON SCHEMA public TO flowvision;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO flowvision;
EOSQL
echo "(Se aparecer 'already exists' acima, pode ignorar.)"

echo "=== 4. Verificar ==="
sudo systemctl status postgresql --no-pager || true
echo ""
echo "PostgreSQL está pronto. Podes iniciar o backend com:"
echo "  cd $(dirname "$0")/.. && dotnet run"
echo ""
echo "Connection string usada pelo backend: Host=localhost;Database=flowvision;Username=flowvision;Password=flowvision"
