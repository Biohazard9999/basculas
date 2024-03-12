import { useGlobalState } from "../../context/GlobalState";
import { BiTrash, BiPencil } from 'react-icons/bi'

export function TransactionItem({ transaction: { id, description, amount, folio } }) { // Incluir folio aquí
  const { deleteTransaction ,Unidad} = useGlobalState();
  const sign = amount < 0 ? "-" : "+";

  return (
    <li
    key={id}
    className={`bg-zinc-600 text-white px-3 py-1 rounded-lg mb-2 w-full flex justify-between items-center`}
    style={{ backgroundColor: amount < 0 ? "red" : "green" }}
  >
    <div>
      <p>{folio}</p>
      <p>{description}</p>
    </div>
    <div>
      <span> {sign} {Math.abs(amount)} {Unidad}</span>

      {/* <button onClick={() => deleteTransaction(id)} className="font-bold text-white rounded-lg ml-2">
        <BiTrash />
      </button> */}
    </div>
  </li>
  );
}
