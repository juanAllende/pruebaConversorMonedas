let chart; // Variable global para almacenar la instancia del gráfico

document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const convertButton = document.getElementById('convert-btn');
    const currencySelect = document.getElementById('currency');
    const resultDiv = document.getElementById('result');
    const conversionDirectionSelect = document.getElementById('conversion-direction');

    // Función para formatear números con separador de miles
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Función para desformatear números
    function unformatNumber(formattedNumber) {
        return formattedNumber.replace(/\./g, '');
    }

    // Carga todas las monedas disponibles desde la API
    async function loadCurrencies() {
        try {
            const response = await fetch('https://mindicador.cl/api');
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la API');
            }
            const data = await response.json();
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object' && data[key].codigo) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = data[key].nombre;
                    currencySelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error al cargar las monedas:', error);
        }
    }

    loadCurrencies(); // Cargar monedas al cargar la página

    amountInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const unformattedValue = unformatNumber(value);
        const formattedValue = formatNumber(unformattedValue);
        amountInput.value = formattedValue;
    });

    convertButton.addEventListener('click', async () => {
        let amount = unformatNumber(amountInput.value);
        const currency = currencySelect.value;
        const direction = conversionDirectionSelect.value;

        if (amount === '') {
            resultDiv.textContent = 'Por favor ingresa una cantidad.';
            return;
        }

        try {
            const response = await fetch(`https://mindicador.cl/api/${currency}`);
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la API');
            }
            const data = await response.json();  // Solo convertimos la respuesta a JSON una vez aquí
            const rate = data.serie[0].valor;  // Tasa más reciente

            let convertedAmount;
            if (direction === "CLP_to_X") {
                convertedAmount = (amount / rate).toFixed(2);
                resultDiv.innerHTML = `Resultado: ${formatNumber(amount)} CLP son ${formatNumber(convertedAmount)} ${data.nombre}`;
            } else {
                convertedAmount = (amount * rate).toFixed(2);
                resultDiv.innerHTML = `Resultado: ${formatNumber(amount)} ${data.nombre} son ${formatNumber(convertedAmount)} CLP`;
            }

            const labels = data.serie.slice(0, 10).map(item => item.fecha.split('T')[0]);
            const values = data.serie.slice(0, 10).map(item => item.valor);

            if (chart) {
                chart.destroy();
            }

            const ctx = document.getElementById('historyChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Historial últimos 10 días de ${data.nombre}`,
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
