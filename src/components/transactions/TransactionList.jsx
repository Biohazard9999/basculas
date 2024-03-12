import { useGlobalState } from "../../context/GlobalState";
import { TransactionItem } from "./TransactionItem";

export function TransactionList() {
  const { transactions } = useGlobalState();

  if (transactions.length === 0) {
    return (
      <div className="bg-zinc-900 p-4 my-2">
        <div className="h-full flex items-center justify-center w-full flex-col">
          <h1 className="text-xl font-bold my-2">
            No hay actividad reciente.
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-4">
      <h3 className="text-slate-300 text-xl font-bold my-2 text-center">HISTORIAL</h3>
      <ul style={{ maxHeight: '20rem', overflowY: 'auto' }}>
        {transactions.length > 0 && (
          <ul style={{ maxHeight: '20rem', overflowY: 'auto' }}>
            {transactions
              .slice()
              .sort((a, b) => {
                // Extrae los números de los folios para compararlos
                const folioNumberA = parseInt(a.folio.match(/\d+/), 10);
                const folioNumberB = parseInt(b.folio.match(/\d+/), 10);

                // Compara primero por número de folio
                if (folioNumberA !== folioNumberB) {
                  return folioNumberA - folioNumberB;
                }

                // Si los folios son iguales, prioriza los montos positivos sobre los negativos
                const isAPositive = a.amount > 0;
                const isBPositive = b.amount > 0;
                if (isAPositive !== isBPositive) {
                  return isBPositive ? 1 : -1; // Los positivos primero
                }

                // Finalmente, dentro del mismo tipo (positivo o negativo), ordena de mayor a menor monto
                return b.amount - a.amount;
              })
              .map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
          </ul>
        )}
      </ul>
    </div>
  );
}
