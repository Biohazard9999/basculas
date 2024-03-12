import express from 'express';
import cors from 'cors';
import { ReadlineParser } from '@serialport/parser-readline';

const app = express();
const port = 4000;

app.use(cors());

// Importa SerialPort de manera dinámica
import('serialport').then(SerialPortModule => {
    const SerialPort = SerialPortModule.SerialPort;
    const serialPortInstance = new SerialPort({ path: 'COM3', baudRate: 9600 });
    const parser = serialPortInstance.pipe(new ReadlineParser());

    let datosRecibidos = '';
    let pesoFiltrado = '';
    let unidadMedida = '';
    let serialPortConnected = false;
    let estadoConexion = 'desconectado'; // Puede ser 'conectado', 'desconectado', 'reconectando'

    const intentarReconectar = () => {
        return new Promise((resolve, reject) => {
            if(serialPortConnected) {
                resolve('El puerto serial ya está conectado.');
                return;
            }

            estadoConexion = 'reconectando';
            console.log('Intentando reconectar el puerto serial...');
            serialPortInstance.open((err) => {
                if (err) {
                    console.error('Error al intentar reconectar el puerto serial:', err.message);
                    estadoConexion = 'desconectado';
                    reject('Error al intentar reconectar el puerto serial.');
                } else {
                    console.log('Puerto serial reconectado exitosamente');
                    serialPortConnected = true;
                    estadoConexion = 'conectado';
                    resolve('Puerto serial reconectado exitosamente.');
                }
            });
        });
    };

    serialPortInstance.on('open', () => {
        console.log('Puerto serial conectado');
        serialPortConnected = true;
        estadoConexion = 'conectado';
    });

    serialPortInstance.on('close', () => {
        console.log('Puerto serial desconectado');
        serialPortConnected = false;
        estadoConexion = 'desconectado';
        setTimeout(() => intentarReconectar().catch(console.error), 10000); // Espera 10 segundos antes de intentar reconectar
    });

    parser.on('data', (line) => {
        datosRecibidos += line;

        const regex = /=(\d+\.\d+)\((\w+)\)/;
        const match = datosRecibidos.match(regex);

        if (match) {
            pesoFiltrado = parseFloat(match[1]).toFixed(1);
            unidadMedida = match[2];
            datosRecibidos = ''; // Limpia datosRecibidos para la próxima lectura
        }
    });

    app.get('/peso', async (req, res) => {
        try {
            if (pesoFiltrado && unidadMedida) {
                res.json({ peso: pesoFiltrado, unidad: unidadMedida });
            } else {
                res.status(404).send('Datos de peso no disponibles.');
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error interno del servidor');
        }
    });

    app.get('/estado-conexion', (req, res) => {
        res.json({ conectado: serialPortConnected, estado: estadoConexion });
    });

    app.get('/reconectar', (req, res) => {
        intentarReconectar()
            .then(mensaje => res.send(mensaje))
            .catch(error => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}).catch(error => console.error('Error al importar SerialPort:', error));
