import React from "react";
import styled from "styled-components";

const CardContainer = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  cursor: grab;
  overflow: hidden;
  position: relative;
  margin: 10px;
  border-radius: 25px;
  border: 10px solid brown;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 25px;
  background-color: brown;
  flex: 1;
`;

const ImageWrapper = styled.div`
  object-fit: cover;
  justify-content: center;
  border-radius: 25px;
  flex: 1;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 25px;
`;

const TextContainer = styled.div`
  background-color: white;
  padding: 10px;
  border-radius: 25px;
  dir: rtl;
  text-align: right;
  border-radius: 25px;
  flex: 1;
`;

const PlayerName = styled.div`
  font-weight: bold;
`;

const CardText = styled.div`
  font-size: 1em;
`;

const MatchedCards = (props) => {
  const { index, playerName, players, card } = props;

  console.log("MatchedCards -- props: ", props)

  const activePlayerIndex = players.findIndex((player) => player.isActive);
  console.log("MatchedCards -- activePlayerIndex", activePlayerIndex)

  const secondPlayerIndex = players.findIndex((player) => !player.isActive);
  console.log("MatchedCards -- secondPlayerIndex", secondPlayerIndex)

  const currentPlayer = activePlayerIndex === index ? players[activePlayerIndex] : players[secondPlayerIndex]
  console.log("MatchedCards -- currentPlayer", currentPlayer)

  const currentText = activePlayerIndex === index ? card.text1 : card.text2
  console.log("MatchedCards -- currentText", currentText)

  return (
    <CardContainer>
      <ContentWrapper>
        <ImageWrapper>
          <Image src={card.imageImportName} alt={card.imageImportName} />
        </ImageWrapper>
        <TextContainer>
          <>
            <PlayerName>{currentPlayer.name}</PlayerName>
            <CardText>TEXT-{index + 1}: {currentText}</CardText>
          </>
        </TextContainer>
      </ContentWrapper>
    </CardContainer>
  );
};

export default MatchedCards;
