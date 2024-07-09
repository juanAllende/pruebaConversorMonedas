document.getElementById('convert-btn').addEventListener('click', async () => {
    const amount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;
    const resultDiv = document.getElementById('result');

    if (amount === '') {
        resultDiv.textContent = 'Por favor ingresa una cantidad.';
        return;
    }

    try {
        const response = await fetch('https://mindicador.cl/api');
        if (!response.ok) {
            throw new Error('Error al obtener los datos de la API');
        }
        const data = await response.json();

        console.log('Datos de la API:', data); // Imprimir datos de la API para verificar estructura

        const currencyKey = currency === 'usd' ? 'dolar' : currency; // Ajustar clave de moneda si es necesario
        if (!data[currencyKey]) {
            throw new Error(`No se encontraron datos para la moneda seleccionada: ${currency}`);
        }

        const rate = data[currencyKey].valor;
        const convertedAmount = (amount / rate).toFixed(2);

        resultDiv.innerHTML = `Resultado: ${amount} CLP son ${convertedAmount} ${currency.toUpperCase()}`;

        const historyResponse = await fetch(`https://mindicador.cl/api/${currencyKey}`);
        if (!historyResponse.ok) {
            throw new Error('Error al obtener los datos del historial de la API');
        }
        const historyData = await historyResponse.json();

        if (!historyData.serie) {
            throw new Error('No se encontraron datos históricos para la moneda seleccionada');
        }

        const labels = historyData.serie.slice(0, 10).map(item => item.fecha.split('T')[0]);
        const values = historyData.serie.slice(0, 10).map(item => item.valor);

        const ctx = document.getElementById('historyChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Historial últimos 10 días (${currency.toUpperCase()})`,
                    data: values,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
        console.error(error);
    }
});
