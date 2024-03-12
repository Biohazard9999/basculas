import { useContext, useReducer, createContext, useEffect } from "react";
import AppReducer from "./AppReducer";

const initialState = {
  transactions: [],
  Unidad: "kg",
};

export const Context = createContext(initialState);

export const useGlobalState = () => {
  const context = useContext(Context);
  if (!context)
    throw new Error("useGlobalState must be used within a GlobalState");
  return context;
};

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState, () => {
    const localData = localStorage.getItem("transactions");
    return localData ? JSON.parse(localData) : initialState;
  });

  const setUnidad = (newUnidad) => {
    dispatch({
      type: "SET_UNIDAD",
      payload: newUnidad,
    });
  };

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(state));
  }, [state]);

  const deleteTransaction = (id) =>
    dispatch({
      type: "DELETE_TRANSACTION",
      payload: id,
    });

  const addTransaction = (transaction) =>
    dispatch({
      type: "ADD_TRANSACTION",
      payload: transaction,
    });

  const updateTransaction = () =>
    dispatch({
      type: "UPDATE_TRANSACTION",
    });

  const resetTransactions = () =>
    dispatch({
      type: "RESET_TRANSACTIONS",
    });

  return (
    <Context.Provider
      value={{
        transactions: state.transactions,
        Unidad: state.Unidad,
        deleteTransaction,
        addTransaction,
        updateTransaction,
        resetTransactions,
        setUnidad, // Agregar la función setUnidad al contexto
      }}
    >
      {children}
    </Context.Provider>
  );
};
