/**
 * Script de Teste de Webhook - PushinPay
 * Como usar: node test_webhook_pushinpay.js <URL_WEBHOOK> <WEBHOOK_TOKEN> <TRANSACTION_ID>
 * Exemplo local: node test_webhook_pushinpay.js http://localhost:3000/api/webhooks/pushinpay meuTokenSecreto 123456
 */
const http = require('http');
const https = require('https');

const args = process.argv.slice(2);
const webhookUrl = args[0] || 'http://localhost:3000/api/webhooks/pushinpay';
const webhookToken = args[1] || 'meu_token_de_teste';
const transactionId = args[2] || 'coloque_um_id_do_banco';

console.log("🚀 Iniciando simulação de Webhook da PushinPay...");
console.log(`📍 URL Alvo: ${webhookUrl}`);
console.log(`🔑 Token de Segurança: ${webhookToken.substring(0, 4)}...`);
console.log(`🆔 ID da Transação: ${transactionId}\n`);

// Payload JSON simulando o pagamento concluído na PushinPay
const payload = JSON.stringify({
    transaction_id: transactionId,
    status: 'paid',
    value: '5.00',
    created_at: new Date().toISOString()
});

const urlObj = new URL(webhookUrl);
const client = urlObj.protocol === 'https:' ? https : http;

const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-pushinpay-token': webhookToken,
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = client.request(options, (res) => {
    let data = '';
    console.log(`STATUS HTTP RETORNADO: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('RESPOSTA DO SERVIDOR:', data);
        if (res.statusCode === 200) {
            console.log('\n🟢 SUCESSO: Webhook aceito e processado!');
        } else {
            console.log('\n🔴 ERRO: Verifique o console da aplicação e os tokens no .env');
        }
    });
});

req.on('error', (e) => {
    console.error(`\n❌ Falha na conexão: ${e.message}`);
});

req.write(payload);
req.end();
