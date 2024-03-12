import { useGlobalState } from "../context/GlobalState";

export function Balance() {
  const { transactions, Unidad, setUnidad } = useGlobalState();

  const amounts = transactions.map((transaction) => transaction.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(4);

  // Cambiar el valor de Unidad
  const toggleUnidad = () => {
    const newUnidad = Unidad === "Kg" ? "Lb" : "Kg";
    setUnidad(newUnidad);
  };

  return (
    <div className="flex justify-between items-center my-2">
      <h4 className="text-slate-400">Balance Actual </h4>
      <h4 className="text-2xl font-bold"> {total} {Unidad} </h4>
      {/* <button onClick={toggleUnidad}>{Unidad === "Kg" ? "Lb" : "Kg"}</button> */}
    </div>
  );
}
