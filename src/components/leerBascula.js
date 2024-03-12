

function leerBascula() {
  let puertoEncontrado = null;
  let datosRecibidos = '';
  let pesoFiltrado = null;
  let unidadMedida = null;
  let TEST="test de conexion"

  // SerialPort.list().then(ports => {
  //   ports.forEach(port => {
  //     if (port.manufacturer === 'Prolific') {
  //       puertoEncontrado = port.path;
  //     }
  //   });

  //   if (puertoEncontrado) {
  //     const parser = new ByteLengthParser({ length: 8 });
  //     const port = new SerialPort({
  //       path: puertoEncontrado,
  //       baudRate: 9600,
  //       parser
  //     });

  //     port.on('data', data => {
  //       const datosString = data.toString();
  //       datosRecibidos += datosString;

  //       const regex = /=(\d+\.\d+)\((\w+)\)/;
  //       const match = datosRecibidos.match(regex);

  //       if (match) {
  //         pesoFiltrado = parseFloat(match[1]).toFixed(1);
  //         unidadMedida = match[2];
  //         port.close();
  //       }
  //     });

  //     port.on('error', err => {
  //       console.error('Error de conexión:', err);
  //     });
  //   } else {
  //     console.log('Dispositivo no encontrado.');
  //   }
  // }).catch(err => {
  //   console.error('Error al listar los puertos:', err);
  // });

  return {
    pesoFiltrado,
    unidadMedida,
    TEST,
  };
}

// Export the function for use in the server.js file
export default leerBascula;
