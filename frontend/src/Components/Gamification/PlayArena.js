import React from 'react'
import Draggable from 'react-draggable'
import TicTacToe from './TicTacToe'

const PlayArena = ({myTurn, setMyTurn}) => {
    return (
        <Draggable style={{ zIndex: '90' }}>
            <div>
                <TicTacToe myTurn={myTurn} setMyTurn={setMyTurn} />
            </div>
        </Draggable>
    )
}

export default PlayArena
