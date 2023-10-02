// HELPERS
let activeRooms = [];  // KEEP TRACK OF PLAYERS
// const isEmpty = obj => !Object.keys(obj).length;

const updateActiveRoomsWithUpdatedRoom = (updatedRoom) =>  {

  const existingRoomIndex = activeRooms.findIndex((room) => room.id === updatedRoom.id);
  if (existingRoomIndex !== -1) {
    activeRooms[existingRoomIndex] = updatedRoom;
  }
  else  {
    activeRooms.push(updatedRoom)
  }
}


const getRoomFromActiveRooms = (room) =>  {
  const existingRoomIndex = activeRooms.findIndex((r) => r.id === room.id);
  if (existingRoomIndex !== -1) {
    return activeRooms[existingRoomIndex]
  }
  else  {
    return null
  }
}

createNewRoom = (chosenRoom, roomId) => {
  let newRoom = {
    ...chosenRoom,
    id: roomId,
  }
  return newRoom
}

setRoomToAddPlayer = (chosenRoom) => {
  let updatedRoom; 

  updatedRoom = getRoomFromActiveRooms(chosenRoom)

  updatedRoom = updatedRoom != null ? updatedRoom : chosenRoom 

  if ( updatedRoom.currentPlayers.length === 0)  {
    updatedRoom = createNewRoom(updatedRoom, updatedRoom.id)
  }
  else {if ( updatedRoom.currentPlayers.length <= updatedRoom.maxMembers)  {

    updatedRoom = {...updatedRoom}
  }}
  if (updatedRoom.currentPlayers.length > updatedRoom.maxMembers)  {  // ROOM FULL - OPEN NEW ONE WITH NEW ID
    updatedRoom = createNewRoom(updatedRoom, updatedRoom.id+updatedRoom.id)
  }
  
  updatedRoom.cardsData.map( (card, index) =>  {
    // Reset all game cards to be on thier back side - when a new players joins - to start the game from start
    card.isFlipped = true
  } )
  return updatedRoom
}

function movePlayerToEnd(currentPlayers, playerName) {
  // Find the index of the player to move
  const playerIndex = currentPlayers.findIndex((player) => player.name === playerName);

  // If the player is found in the array
  if (playerIndex !== -1) {
    // Remove the player from the array
    const playerToMove = currentPlayers.splice(playerIndex, 1)[0];

    // Push the player back to the end of the array
    currentPlayers.push(playerToMove);
  }
  return currentPlayers;
}


addPlayerToRoom = (room, playerName, socketId) => {
  // PREPARE THE ROOM TO ADD PLAYER TOO
  let updatedRoom
  let startGame = room.startGame
       
  const existingPlayer = room.currentPlayers && room.currentPlayers.find((player) => player.name === playerName);
  if (existingPlayer) {
    console.log("Player ", playerName , " already present in room ", room,  "- MOVING HIM TO BE LAST IN PLAYERS ARRAY ")
    room.currentPlayers = movePlayerToEnd(room.currentPlayers, playerName)  // MOVE EXISTING PLAYER TO END OF currentPlayers ARR
    updatedRoom = { ...room }
    return updatedRoom

  } else {
    newPlayer = {
      socketId: socketId,
      name: playerName,
      email: "",
      isWinner: false,
      isActive: false,
    };
   
    room.currentPlayers.push(newPlayer);

    if ( room.currentPlayers.length === room.maxMembers )  {  // ALL PLAYERS HERE - START GAME
      startGame = true
    }

    room.currentPlayers.map( (player, index) =>  {
      // FIRST PLAYER TO JOIN iS ACTIVE => GOES FIRST IN THE GAME
      index === 0 ? player.isActive = true : player.isActive = false 
    } )

    updatedRoom = {
      ...room,
      startGame: startGame,
    }
    console.log("addPlayer " , playerName, "ToRoom -- returning -- updatedRoom: ", updatedRoom)
    return updatedRoom
  }
}

// SOCKET SERVICES

console.log("IN serverSocketServices.js");

const serverSocketServices = (io) => {

  io.on("connection", (socket) => {

    socket.on("CREATE_ROOM_AND_ADD_PLAYER", ({ playerName, chosenRoom }) => {
      let updatedRoom;
      updatedRoom = setRoomToAddPlayer(chosenRoom, playerName)

      updatedRoom = addPlayerToRoom(updatedRoom, playerName, socket.id)

      updateActiveRoomsWithUpdatedRoom(updatedRoom)

      console.log("AFTER ADDING PLAYER ", playerName , "to room ", chosenRoom, "updatedRoom:", updatedRoom, "activeRooms:", activeRooms )

      io.emit("UPDATED_CURRENT_ROOM", updatedRoom);
    });

    
	socket.on("REMOVE_PLAYER_FROM_ROOM", ({ playerName, chosenRoom }) => {
    let existingRoom, updatedRoom;
    let existingPlayer = {}
     
    existingRoom = getRoomFromActiveRooms(chosenRoom) 

    if (!existingRoom) {
      return { playerName, chosenRoom }
    }  else {
      updatedRoom = existingRoom;
    }

    existingPlayer = updatedRoom.currentPlayers && updatedRoom.currentPlayers.find((player) => player.name === playerName);  
    if (existingPlayer) {
      const updatedPlayers = [...updatedRoom.currentPlayers];
      const playerIndex = updatedRoom.currentPlayers.findIndex((player) => player.name === playerName);

      updatedPlayers.splice(playerIndex, 1);  // REMOVE playerName cell
      updatedRoom = {
        ... updatedRoom,
        currentPlayers: updatedPlayers,
      }
      if ( updatedPlayers.length == 0 )  {  // NO PLAYERS IN THE ROOM
        updatedRoom = {
          ... updatedRoom,
          startGame: false,
          endGame: false,
        }
      }
    }
    console.log("SERVER -- SFTER REMOVING ", playerName, "FROM ROOM ", chosenRoom)
    console.log("SERVER -- SFTER REMOVING ", updatedRoom, updatedRoom)
    console.log("SERVER -- SFTER REMOVING ", activeRooms, activeRooms)

    updateActiveRoomsWithUpdatedRoom(updatedRoom)  
    io.emit("UPDATED_CURRENT_ROOM", updatedRoom);
    });
    

    socket.on("CURENT_ROOM_CHANGED", (updatedRoom) => {
      updateActiveRoomsWithUpdatedRoom(updatedRoom) 
      io.emit("UPDATED_CURRENT_ROOM", updatedRoom);
    });


    socket.on("MATCHED_CARDS_CHANGED", (matchedCards) => {
      io.emit("UPDATED_MATCHED_CARDS", matchedCards);
    });

    
    socket.on("START_GAME", () => {
      io.emit("UPDATED_START_GAME");
    });

    
    socket.on("END_GAME", () => {
      io.emit("UPDATED_END_GAME");
    });


  });

};

module.exports = serverSocketServices;
