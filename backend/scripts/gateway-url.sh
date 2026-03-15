#!/bin/bash
# Mostra o URL para aceder ao gateway a partir do browser no Windows (WSL2).
# No WSL2, localhost no Windows NÃO é o mesmo que no Linux — use o IP abaixo.

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "=============================================="
echo "  Gateway Vision OEE — URL para o browser"
echo "=============================================="
echo ""
echo "  Se estás no Windows, usa no browser:"
echo ""
echo "    http://${IP:-localhost}:5050"
echo ""
echo "  (localhost:5050 só funciona dentro do WSL)"
echo ""
echo "  Endpoints úteis:"
echo "    Health:  http://${IP:-localhost}:5050/health"
echo "    Swagger: http://${IP:-localhost}:5050/swagger"
echo "    Gateway: http://${IP:-localhost}:5050/api/gateway/status"
echo "             (header: X-API-Key: gateway-secret-key)"
echo ""
echo "=============================================="
echo ""
