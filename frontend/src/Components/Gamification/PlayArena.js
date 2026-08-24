import React from 'react'
import Draggable from 'react-draggable'
import TicTacToe from './TicTacToe'

const PlayArena = ({myTurn, setMyTurn}) => {
    return (
        <Draggable>
            <div style={{ position: 'relative', zIndex: 90 }}>
                <TicTacToe myTurn={myTurn} setMyTurn={setMyTurn} />
            </div>
        </Draggable>
    )
}

export default PlayArena
