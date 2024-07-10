let chart; // Variable global para almacenar la instancia del gráfico

document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const convertButton = document.getElementById('convert-btn');
    const currencySelect = document.getElementById('currency');
    const resultDiv = document.getElementById('result');

    // Función para formatear números con separador de miles
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Función para desformatear números
    function unformatNumber(formattedNumber) {
        return formattedNumber.replace(/\./g, '');
    }

    // Evento para formatear el número a medida que se ingresa
    amountInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const unformattedValue = unformatNumber(value);
        const formattedValue = formatNumber(unformattedValue);
        amountInput.value = formattedValue;
    });

    convertButton.addEventListener('click', async () => {
        let amount = amountInput.value;
        const currency = currencySelect.value;

        // Desformatear el número para obtener el valor original
        amount = unformatNumber(amount);

        if (amount === '') {
            resultDiv.textContent = 'Por favor ingresa una cantidad.';
            return;
        }

        // Mapeo de claves de moneda según la API
        const currencyMap = {
            usd: 'dolar',
            eur: 'euro'
            // Añade más mapeos según las monedas disponibles en la API
        };

        try {
            const response = await fetch('https://mindicador.cl/api');
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la API');
            }
            const data = await response.json();

            console.log('Datos de la API:', data); // Imprimir datos de la API para verificar estructura

            const currencyKey = currencyMap[currency];
            if (!data[currencyKey]) {
                throw new Error(`No se encontraron datos para la moneda seleccionada: ${currency}`);
            }

            const rate = data[currencyKey].valor;
            const convertedAmount = (amount / rate).toFixed(2);

            resultDiv.innerHTML = `Resultado: ${formatNumber(amount)} CLP son ${formatNumber(convertedAmount)} ${currency.toUpperCase()}`;

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

            if (chart) {
                chart.destroy(); // Destruir la gráfica anterior si existe
            }

            const ctx = document.getElementById('historyChart').getContext('2d');
            chart = new Chart(ctx, {
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
});
