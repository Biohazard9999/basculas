import React, { useState, useEffect } from 'react';
import { GlobalProvider } from "./context/GlobalState";
import { Header } from "./components/Header";
import { Balance } from "./components/Balance";
import { IncomeExpenses } from "./components/IncomeExpenses";
import { TransactionList } from "./components/transactions/TransactionList";
import { TransactionForm } from "./components/transactions/TransactionForm";

function App() {
  const [message, setMessage] = useState('');
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false); // Nuevo estado para manejar el estado de "cargando"

  const fetchData = () => {
    fetch('http://localhost:4000/peso')
      .then(response => {
        if (!response.ok) {
          throw new Error('Datos de peso no disponibles.');
        }
        return response.json();
      })
      .then(data => {
        if (data.peso && data.unidad) {
          setMessage(`Peso: ${data.peso} ${data.unidad}`);
          setIsServerConnected(true);
        } else {
          throw new Error('Formato de datos incorrecto.');
        }
      })
      .catch(error => {
        setMessage(error.toString());
        setIsServerConnected(false);
        setIsSerialConnected(false);
      });
  };

  const verificarConexion = () => {
    fetch('http://localhost:4000/estado-conexion')
      .then(res => res.json())
      .then(data => {
        setIsSerialConnected(data.conectado);
      })
      .catch(err => {
        console.error("Error al verificar el estado de la conexión:", err);
        setIsSerialConnected(false);
        setIsServerConnected(false); // Asumiendo que también puedes verificar el estado del servidor aquí
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    verificarConexion();
    const intervalId = setInterval(verificarConexion, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleReconnect = () => {
    setIsReconnecting(true); // Indica que el proceso de reconexión ha comenzado
    fetch('http://localhost:4000/reconectar')
      .then(response => response.text())
      .then(message => {
        console.log(message); // Puedes mostrar este mensaje en la UI si lo deseas
        verificarConexion(); // Verifica el estado de la conexión después de intentar reconectar
      })
      .catch(error => {
        console.error("Error durante la reconexión:", error);
      })
      .finally(() => {
        setIsReconnecting(false); // Restablece el estado de "cargando" independientemente del resultado
      });
  };

  return (
    <GlobalProvider>
      <div className="bg-neutral-950 text-white h-screen flex justify-center items-center">
        <div className="w-3/5 flex justify-center items-center">
          <div className="bg-neutral-800 pt-1 px-10 pb-10 rounded-md w-full">
            <Header />
            <h1 style={{ paddingBottom: '10px' }}>Estado de la Conexión: {isSerialConnected && isServerConnected ? 'Conectado' : 'Desconectado'}</h1>
           
            <button onClick={handleReconnect} disabled={isReconnecting}
             className="bg-blue-500 text-white px-3 py-2 rounded-lg flex-grow"
                      
            >
              {isReconnecting ? 'Reconectando...' : 'Reconectar'}
            </button>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <IncomeExpenses />
                <Balance />
                <TransactionForm message={message}/>
              </div>
              <div className="flex-1 flex flex-col">
                <TransactionList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalProvider>
  );
}

export default App;
