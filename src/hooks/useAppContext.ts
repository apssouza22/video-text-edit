import {AppContext, AppState} from "../context/AppContext"
import {useContext} from "react"

export const useAppContext = (): AppState => {
    const context = useContext<AppState>(AppContext)

    if (!context) {
        throw Error('useAppContext must be used inside an AppContextProvider')
    }

    return context
}
