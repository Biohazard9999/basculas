export default (state, action) => {
  switch (action.type) {
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        ),
      };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "UPDATE_TRANSACTION":
        return state;
    case "RESET_TRANSACTIONS":
      return {
        ...state,
        transactions: [],
      };
    case "SET_UNIDAD":
      return {
        ...state,
        Unidad: action.payload,
      };
    default:
      return state;
  }
};
