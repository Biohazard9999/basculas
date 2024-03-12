import { useState, useEffect } from "react";
import { useGlobalState } from "../../context/GlobalState";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function TransactionForm({ message }) {
  const { addTransaction, transactions, updateTransaction, resetTransactions, Unidad, setUnidad } = useGlobalState();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState("E");
  const [esCargaInicial, setEsCargaInicial] = useState(true);

  useEffect(() => {
    setEsCargaInicial(false);
  }, []);

  useEffect(() => {
    if (esCargaInicial) {
      return;
    }

    console.log("Mensaje recibido:", message); // Para depuración, verifica el mensaje recibido

    const regex = /Peso:\s*[0-9.]+\s*(lb|kg)/; // Esta expresión regular busca "Peso:" seguido de un número y luego "lb" o "kg".
    const match = message.match(regex);

    if (match && match[1]) {
      console.log("Unidad extraída:", match[1]); // Esto debería imprimir "lb" o "kg" dependiendo del mensaje.
      if (Unidad !== match[1]) {
        const yaHayFoliosRegistrados = transactions.some(transaction => transaction.folio && transaction.folio.trim() !== "");
        if (!yaHayFoliosRegistrados) {
          console.log("Actualizando Unidad a:", match[1]);
          setUnidad(match[1]);
        } else {
          console.log("Operación inválida: ya existe unidad asignada .",{Unidad});
          alert("Operación inválida: ya existe unidad asignada: " + Unidad.toString());
        }
      }
    } else {
      console.log("No se pudo extraer la unidad del mensaje.");
    }
  }, [message, Unidad, setUnidad, transactions, esCargaInicial]);

  const handleSetAmountFromMessage = () => {
    const regex = /Peso:\s*([0-9.]+)\s*(lb|kg)/;
    const match = message.match(regex);

    if (match) {
      const peso = parseFloat(match[1]);
      const unidad = match[2];

      if (unidad === "lb") {
     
       //conversion de libras a kilos
        /*   const kilograms = peso * 0.453592;
        setAmount(kilograms.toString()) */;
        
        setAmount(peso.toString());

      } else {
        setAmount(peso.toString());
      }
    } else {
      console.log("No se pudo extraer el peso del mensaje.");
    }
  };

  const generateFolio = () => {
    const folioNumbers = transactions
      .map(transaction => parseInt(transaction.folio.match(/\d+/)?.[0] || "0", 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);

    let nextFolioNumber = 1;
    if (folioNumbers.length > 0) {
      nextFolioNumber = folioNumbers[folioNumbers.length - 1] + 1;
    }

    const currentDate = new Date().toLocaleDateString("es-MX");
    return `FOLIO ${nextFolioNumber.toString().padStart(2, "0")} FECHA ${currentDate}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "folio") {
      const selectedTransaction = transactions.find(
        (transaction) => transaction.folio === value
      );
      setSelectedTransaction(selectedTransaction);

      if (value === "") {
        setDescription("");
        setAmount('');
        setTransactionType("E");
      } else if (selectedTransaction) {
        setDescription(selectedTransaction.description);
        setAmount(Math.abs(selectedTransaction.amount).toString());
      }
    } else if (name === "descripcion") {
      setDescription(value);
    } else if (name === "monto") {
      setAmount(value);
    } else if (name === "tipoMonto") {
      setTransactionType(value);
      if (amount !== '') {
        setAmount(Math.abs(parseFloat(amount)).toString());
      }
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (parseFloat(amount) === 0) {
      alert("El monto no puede ser 0.");
      return;
    }

    let adjustedAmount = parseFloat(amount);
    adjustedAmount = transactionType === "S" ? -Math.abs(adjustedAmount) : Math.abs(adjustedAmount);

    if ((transactionType === "S" && adjustedAmount > 0) || (transactionType === "E" && adjustedAmount < 0)) {
      alert("Hay una inconsistencia entre el tipo de transacción y el monto.");
      return;
    }

    const fullDescription = `${description}`;
    let folio;
    let isNewTransaction = true;

    if (selectedTransaction) {
      folio = selectedTransaction.folio;
    } else {
      const existingTransaction = transactions.find(t => t.folio === generateFolio());
      if (existingTransaction) {
        folio = existingTransaction.folio;
        isNewTransaction = false;
      } else {
        folio = generateFolio();
      }
    }

    const totalPositivos = transactions
      .filter(t => t.folio === folio && t.amount > 0)
      .reduce((acc, curr) => acc + curr.amount, 0).toFixed(4);

    const totalNegativos = transactions
      .filter(t => t.folio === folio && t.amount < 0)
      .reduce((acc, curr) => acc + curr.amount, 0).toFixed(4);

    if (!selectedTransaction && adjustedAmount < 0) {
      alert("Selecciona un Folio para dar salida.");
      return; // Detiene la ejecución si no se ha seleccionado un folio para salida
    }

    if (adjustedAmount < 0 && Math.abs(totalNegativos) + Math.abs(adjustedAmount) > totalPositivos) {
      alert("Excedes el monto de entrada de el folio.");
      return; // Detiene la ejecución si se excede el monto de entrada
    }

    const newTotalPositivos = totalPositivos + (adjustedAmount > 0 ? +adjustedAmount : 0);
    const newTotalNegativos = totalNegativos + (adjustedAmount < 0 ? +adjustedAmount : 0);

    if (isNewTransaction) {
      addTransaction({
        id: window.crypto.randomUUID(),
        description: fullDescription,
        amount: adjustedAmount,
        folio,
        totalPositivos: newTotalPositivos,
        totalNegativos: newTotalNegativos,
      });
    } else {
      updateTransaction({
        ...selectedTransaction,
        description: fullDescription,
        amount: adjustedAmount,
        totalPositivos: newTotalPositivos,
        totalNegativos: newTotalNegativos,
      });
    }

    setDescription("");
    setAmount('');
    setSelectedTransaction(null);
  };

  const handleResetTransactions = () => {
    resetTransactions();
    setDescription("");
    setAmount('');
    setSelectedTransaction(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    const tableColumn = ["Folio", "Descripción", "Total E", "Total S", "Total E/S"];
    const consolidatedTransactions = transactions.reduce((acc, { folio, description, amount }) => {
      if (!acc[folio]) {
        acc[folio] = { folio, description, totalE: 0, totalS: 0, totalES: 0 };
      }
      if (amount >= 0) {
        acc[folio].totalE += amount;
      } else {
        acc[folio].totalS += Math.abs(amount); // Convertimos a positivo para totalS
      }
      acc[folio].totalES = acc[folio].totalE - acc[folio].totalS;
      return acc;
    }, {});

    const tableRows = Object.values(consolidatedTransactions)
      .sort((a, b) => {
        const folioNumberA = parseInt(a.folio.match(/\d+/), 10);
        const folioNumberB = parseInt(b.folio.match(/\d+/), 10);
        return folioNumberA - folioNumberB;
      })
      .map(({ folio, description, totalE, totalS, totalES }) => [
        folio,
        description,
        totalE.toFixed(4) +" "+ Unidad,
        totalS.toFixed(4) +" "+ Unidad,
        totalES.toFixed(4)+" "+ Unidad,
      ]);

    let totalGlobalE = 0;
    let totalGlobalS = 0;
    Object.values(consolidatedTransactions).forEach(({ totalE, totalS }) => {
      totalGlobalE += totalE;
      totalGlobalS += totalS;
    });
    const totalGlobalES = totalGlobalE - totalGlobalS;

    doc.text("Historial de Pesos", 14, 15);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    const finalY = doc.lastAutoTable.finalY || 20; // Obtiene la última posición Y de la tabla
    autoTable(doc, {
      head: [['', '', 'Total Global E', 'Total Global S', 'Total Global E/S']],
      body: [['', '', totalGlobalE.toFixed(4)+" "+Unidad, totalGlobalS.toFixed(4)+" "+Unidad, totalGlobalES.toFixed(4)+" "+Unidad]],
      startY: finalY + 5,
      theme: 'plain',
      tableWidth: 'wrap',
      showHead: 'firstPage',
    });
    doc.save("historial.pdf");
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <select
          name="folio"
          value={selectedTransaction?.folio || ""}
          onChange={handleChange}
          className="bg-zinc-600 text-white px-3 py-1 rounded-lg block mb-2 min-w-[400px]"
          multiple={false}
          size={4}
        >
          <option value="">Crear Folio</option>
          {transactions.slice().reverse()
            .filter((transaction, index, self) =>
              index === self.findIndex((t) => (
                t.folio === transaction.folio
              ))
            )
            .map((transaction) => (
              <option key={transaction.id} value={transaction.folio}>
                {transaction.folio}
              </option>
            ))}
        </select>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="radio"
            id="entrada"
            name="tipoMonto"
            value="E"
            onChange={handleChange}
            checked={transactionType === "E"}
          />
          <label htmlFor="entrada" style={{ marginRight: '10px' }}>E (Entrada)</label>

          <input
            type="radio"
            id="salida"
            name="tipoMonto"
            value="S"
            onChange={handleChange}
            checked={transactionType === "S"}
          />
          <label htmlFor="salida">S (Salida)</label>
        </div>

        <input
          name="descripcion"
          type="text"
          onChange={handleChange}
          placeholder="Descripcion"
          className="bg-zinc-600 text-white px-3 py-2 rounded-lg block mb-2 w-full"
          value={description}
        />
        <input
          key={amount} // Forzar re-renderización del input cuando amount cambie
          name="monto"
          type="number"
          onChange={handleChange}
          onKeyDown={(e) => {
            if (!/[\d,.|\u{202F}]/.test(e.key) && e.key !== "Backspace") {
              e.preventDefault();
            }
          }}
          placeholder="0.00"
          className="bg-zinc-600 text-white px-3 py-2 rounded-lg block mb-2 w-full"
          value={amount || ''} // Asegurarse de que el valor no sea undefined
          disabled
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            className="bg-indigo-700 text-white px-3 py-2 rounded-lg flex-grow disabled:opacity-50"
            disabled={!description || amount === ''}
          >
            Registrar
          </button>
          <button
            type="button"
            onClick={handleSetAmountFromMessage}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg flex-grow"
          >
           Calcular Peso
          </button>
        </div>
        <button
          type="button"
          onClick={handleResetTransactions}
          className="bg-red-600 text-white px-3 py-2 rounded-lg block mt-2 w-full"
        >
          Nuevo Registro
        </button>
        <button
          type="button"
          onClick={generatePDF}
          className="bg-green-600 text-white px-3 py-2 rounded-lg block mt-2 w-full"
        >
          Guardar en PDF
        </button>
      </form>
    </div>
  );
}
