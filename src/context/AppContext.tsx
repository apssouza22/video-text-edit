import { createContext, PropsWithChildren, useReducer } from "react";

export interface AppState {
    dispatch: React.Dispatch<Action>;
    wordTimestamps: Array<WordTimestamp>;
    selectedWord: WordTimestamp | undefined;
}

export interface WordTimestamp{
    text: string;
    timestamp: [number, number | null];
}

export interface Action {
    type: string
    payload: any
}

let defaultValue = {
    wordTimestamps: Array<WordTimestamp>(),
    selectedWord: undefined,
    dispatch: () => {}
}

export const AppContext = createContext<AppState>(defaultValue)

const appReducer = (state: AppState, action: Action) => {
    switch (action.type) {
        case 'ADD_WORD_TIMESTEP':
            if (!state.wordTimestamps.includes(action.payload)) {
                state.wordTimestamps.push(action.payload);
            }
            return {...state}

        case 'ADD_SELECTED_WORD':
            return {...state, selectedWord: action.payload}

        default:
            return state
    }
}

export const AppContextProvider = ({children}: PropsWithChildren) => {
    const [state, dispatch] = useReducer(appReducer, defaultValue)

    return (
        <AppContext.Provider value={{...state, dispatch}}>
            {children}
        </AppContext.Provider>
    )

}
