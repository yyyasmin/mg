import React, { useState, useEffect } from "react";
import styled from "styled-components";
import NikeCard from "./NikeCard";
import Players from "./Players";
import isEmpty from "../helpers/isEmpty";

import MatchedCards from "./MatchedCards";
import TougleMatchedCardButton from "./TougleMatchedCardButton";
import { useLocation } from "react-router-dom";
import { calculateCardSize } from "../helpers/init";

import {
  updateCr,
  updateIsMatched,
  updatePlayerLeft,

  emitRemoveMemberFromRoom,
  emitRemoveRoomFromActiveRooms,
  emitCurentRoomChanged,
  emitCurentIsMatched,
} from "../clientSocketServices";

const GameContainer = styled.div`
  background-color: #fdf2e9;
  color: brown;
  border-radius: 25px;
`;

const Wellcome = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 5px;
  border-radius: 25px;
`;

const CardGallery = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  background-color: #fad5a5;
  border-radius: 25px;
  height: calc(100vh - 100px);
  justify-content: space-between;
`;

function Game() {
  const location = useLocation();
  const { userName, currentRoom } = location.state

  console.log("IN GAME -- currentRoom: ", currentRoom)

  const [cr, setCr] = useState({});

  const [isMatched, setIsMatched] = useState(false);
  const [last2FlippedCards, setLast2FlippedCards] = useState([]);

  const [allFlippedCards, setAllFlippedCards] = useState([]);
  const [clearFlippedCards, setClearFlippedCards] = useState(false);
  const [playerLeft, setPlayerLeft] = useState(null);


  const broadcastChangeCr = async (updatedCr) => {
    await console.log("broadcastChangeCr -- 1111 - updatedCr: ", updatedCr)
    if ( !isEmpty(updatedCr) )  {
        await emitCurentRoomChanged({ ...updatedCr });
      }
    }


  const broadcastChangeIsMatched = async (isMatched, last2FlippedCards) => {
    if ( !isEmpty(cr) && !isEmpty(cr.currentPlayers) )
    await emitCurentIsMatched(isMatched, last2FlippedCards);
  }

  const broadcastChangeCardSize = async (cr) => {
    let updateCrWithNewCardSize
    if ( !isEmpty(cr) ) {
      console.log("IN broadcastChangeCardSize -- cr.cardsData: ", cr.cardsData)
      if ( !isEmpty(cr.cardsData) ) {
        let cardSize = calculateCardSize(cr.cardsData.length)
        updateCrWithNewCardSize = {...cr, cardSize: cardSize}
      }
		  broadcastChangeCr(updateCrWithNewCardSize)
    }
  };


  const resetPlayersFlippCount = () => {
    console.log("IN resetPlayersFlippCount -- cr: ", cr)
    let updatedCurrentPlayers
    if  ( !isEmpty(cr.currentPlayers) )  {
      updatedCurrentPlayers = cr.currentPlayers.map((player) => ({
        ...player,
        flippCount: 0,
      }));
    }
    const updatedCr = {...cr, currentPlayers: updatedCurrentPlayers}
    broadcastChangeCr(updatedCr);
  }


  const handleResize = () => {
		broadcastChangeCardSize(cr);
  }

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  useEffect(() => {
    updateCr(setCr)
	broadcastChangeCr(currentRoom);
    updateIsMatched(setIsMatched, setLast2FlippedCards)
    if (!isEmpty(currentRoom) && !isEmpty(userName)) {
      broadcastChangeCardSize(currentRoom);  // Update Cr is in broadcastChangeCardSize
    }
  }, [currentRoom]);


  window.onbeforeunload = async function (e) {
    await updatePlayerLeft(setPlayerLeft);
    await updateCr(setCr);
    if (!isEmpty(userName) && !isEmpty(cr)) {
      await emitRemoveMemberFromRoom({
        playerName: userName,
        chosenRoom: cr,
      });
	  if ( !isEmpty(cr) && cr.currentPlayers==[] ) {
		emitRemoveRoomFromActiveRooms(cr.id)
	  }
    }
    var dialogText = 'Are you really sure you want to leave?';
    console.log("Game -- handleBeforeUnload -- dialogText: ", dialogText);
    e.returnValue = dialogText;
    return dialogText;
  };
  
   
  useEffect( () => {
    const asyncClear = async() =>  {
      if (clearFlippedCards) {
        await setAllFlippedCards([]);
        await broadcastChangeIsMatched(false, [], 0)
        await resetPlayersFlippCount()
        await setClearFlippedCards(false);
        console.log( "useEffect[clearFlippedCards] -- isMatched, cr.currentPlayers: ",
                                                      isMatched, cr.currentPlayers )
      }
    }
    asyncClear()
  }, [clearFlippedCards] );


  const togglePlayerTurn = () => {
    const updatedCurrentPlayers = cr.currentPlayers.map((player) => ({
      ...player,
      isActive: !player.isActive,
      flippCount: 0
    }));
    const updatedRoom = { ...cr, currentPlayers: updatedCurrentPlayers };
    broadcastChangeCr(updatedRoom);
  };


  const checkForMatch = (updatedCard) => {
    const newAllFlippedCards = [...allFlippedCards, updatedCard];
    let tmpIsMatched = false

    setAllFlippedCards(newAllFlippedCards);
    if (newAllFlippedCards.length % 2 === 0) {
      const last2FlippedCards = newAllFlippedCards.slice(-2);
      console.log("IN checkForMatch -- last2FlippedCards: ", last2FlippedCards)
      if ( last2FlippedCards[0].name === last2FlippedCards[1].name )  {
        tmpIsMatched = true
      }
      if (tmpIsMatched)  { 
        console.log("broadcasting -- ", true, last2FlippedCards)         
        broadcastChangeIsMatched(true, last2FlippedCards);
      } else {
        broadcastChangeIsMatched(false, last2FlippedCards);
        // Handle non-matching cards here...
      }
    }
  }
 

  
	const getActivePlayer = () => {
		const activePlayer = cr.currentPlayers.find((player) => player.isActive);
		return {...activePlayer}
	};  

  const handleFlippCount = () =>  {
    let activePlayer = getActivePlayer();
    if (!isEmpty(activePlayer) && cr.currentPlayers.length > 1) {
      const updatedPlayers = cr.currentPlayers.map((player) => {
        if (player.name === activePlayer.name) {
          return { ...activePlayer, flippCount: (isMatched || activePlayer.flippCount>=3) ? 0 : activePlayer.flippCount + 1 };
        } else {
          return { ...player };
        }
      });
      const updatedRoom = { ...cr, currentPlayers: updatedPlayers };
      console.log("handleFlippCount -- FFFFFFF - currentPlayers: isMatched, updatedPlayers", isMatched, updatedPlayers)
      broadcastChangeCr(updatedRoom);
    }
  };

  const updateCardSide = (cardId) =>  {
    const cardIndex = cr.cardsData.findIndex((card) => card.id === cardId);
    if (cardIndex !== -1) {
      const updatedCard = { ...cr.cardsData[cardIndex] };
      updatedCard.isFlipped = !updatedCard.isFlipped;
      const updatedRoom = { ...cr };
      updatedRoom.cardsData[cardIndex] = updatedCard;
      broadcastChangeCr(updatedRoom);
      return updatedCard;
    }
  }

  const toggleCardFlip = async(cardId) => {
      const  updatedCard = await updateCardSide(cardId)
      await checkForMatch(updatedCard);
      await handleFlippCount();
      let activePlayer = getActivePlayer();

      console.log("toggleCardFlip - 3333 - isMatched, CONDITION: ",
                    isMatched,
                    !isEmpty(cr) && !isEmpty(cr.currentPlayers) && 
                    cr.currentPlayers.length > 1 && activePlayer.flippCount >= 3,
                    activePlayer.flippCount
      )
      
      if (!isEmpty(cr) && !isEmpty(cr.currentPlayers) && cr.currentPlayers.length > 1 ) {
        console.log("IN toggleCardFlip --activePlayer: ", activePlayer)
      }

      if (!isEmpty(cr) && !isEmpty(cr.currentPlayers) && cr.currentPlayers.length > 1 && activePlayer.flippCount >= 3) {
        await togglePlayerTurn();
      }
    }


  const handleCardFlip = (cardId) => {
    const currentUserIndex = cr.currentPlayers.findIndex((player) => player.name === userName);
    if (currentUserIndex !== -1 && cr.currentPlayers[currentUserIndex].isActive) {
      toggleCardFlip(cardId);
    }
  };

console.log("BEFORE RENDER -- isMatched: ", isMatched)
console.log("BEFORE RENDER -- last2FlippedCards: ", last2FlippedCards)

  return (
    <GameContainer>
      {playerLeft && <div>{playerLeft} has left the room.</div>}

      <Wellcome>
        <div>Wellcome to room: {cr.name}</div>
      </Wellcome>

      {cr && parseInt(cr.id) >= 0 && cr.currentPlayers && cr.currentPlayers.length > 0 && (
        <Players players={cr.currentPlayers} playerName={userName} />
      )}

      {cr && parseInt(cr.id) >= 0 && (
        <TougleMatchedCardButton
          isMatched={isMatched}
          broadcastChangeIsMatched={(isMatched, last2FlippedCards) => broadcastChangeIsMatched(isMatched, last2FlippedCards)}
          setClearFlippedCards={setClearFlippedCards}
        />
      )}

<CardGallery>
  { isMatched &&
    last2FlippedCards &&
    last2FlippedCards.length > 0 &&
    cr && cr.currentPlayers && 
    cr.currentPlayers.length > 0 ? (
    last2FlippedCards.map((card, index) => (

      <MatchedCards
          key={index} 
          index={index}
          playerName={userName} 
          players={cr.currentPlayers} 
          card={card} />
    ))
  )  : (
      <>
       {  
        cr.cardsData &&
        !isEmpty(cr.cardSize) &&
        cr.cardsData.map((card, index) => (
          <NikeCard
            key={index}
            playerName={userName}
            card={card}
            isFlipped={card.isFlipped}
            cardSize={cr.cardSize}

            toggleCardFlip={() => {
              handleCardFlip(card.id);
            }}
          />
        ))
       }
    </>
  )}
</CardGallery>


    </GameContainer>
  );
}

export default Game;
