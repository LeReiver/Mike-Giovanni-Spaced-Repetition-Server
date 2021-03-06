'use strict';

const {Card} = require('../models/card-model');
const {cardArr} = require('../db/cardDB');


const popCard =(user_id)=>{
  //removes and returns first document in ll
   
  return Card.findOne({user_id:user_id, previous: 'null'})
    .then(found => {
  
      return Card.findOneAndRemove({_id:found._id})
        .then(()=>{
          // console.log('removing', found, 'should update', found.next)
          return Card.findOneAndUpdate({_id:found.next},{previous:'null'});
        })
        .then((updated)=>{
          // console.log('updated?',updated)
          return found;});
    })
    .catch(err=>{console.log('promise error: ', err);});
};


const insertAfter =(cardTemplate, previous = 'null') => {
  //will insert a card after 'previous', chaning the relevant next and previous properties of adjacent cards
  //leaving previous null will insert at head of list
  // console.log('inserting', cardTemplate, 'after', previous)
  
  let card = {};
  card.user_id = cardTemplate.user_id;
  card.imageUrls =cardTemplate.imageUrls ;
  card.previous = previous;
  card.answer = cardTemplate.answer;
  card.mValue = cardTemplate.mValue;
    
  
  return new Promise((resolve, reject) => {
    if(card.previous !== 'null'){
      return Card.findOne({_id:card.previous})
        .then(prev =>{
          card.next = prev.next;
          return(Card.create(card));    
        })
        .then(newCard =>{
          if(newCard.next !== 'null'){
             
            return Card.findOneAndUpdate({_id:card.next}, {previous:`${newCard._id}`})
              .then(()=>{
                return Card.findOneAndUpdate({_id:card.previous}, {next:`${newCard._id}`})
                  .then(()=>{
                    resolve(newCard);
                  });
              });
          }
          else{
            return Card.findOneAndUpdate({_id:card.previous}, {next:`${newCard._id}`})
              .then(()=>{
                resolve(newCard);
              });
          }
        })
        .catch(err =>{  reject(new Error(err)); });
    }
    else if (card.previous === 'null'){
      //if we want to insert at the head of our ll, we will insert -before- our first element
      return Card.find({user_id: card.user_id, previous: 'null'})
        .then(found =>{
          if(found.length === 0){
            resolve(Card.create(card));
          }
          else if(found.length >0){
            card.next = found[0]._id;
            return Card.create(card)
            //create card has to happen after we find our first element(to get it's _id),
            // but before we update that element's previous (because we need to create in order to have a new _id)
              .then((newCard) =>{
                return Card.findOneAndUpdate({_id:found[0]._id}, {previous:`${newCard._id}`})
                  .then(()=>{
                    //but we don't actually care about what our update returns, we want to return our new card
                    resolve(newCard);
                  });
              });
          }
  
        })
        .catch(err =>{  reject(new Error(err)); });
    }
  });
};





const insertAt =(card, index) => {
  //loop thorough our ll ( a while loop, prob.) to find the card before our index, then call insertAfter()
  let i = 0;

  const findNext = (prevID = 'null') => {
    return Card.findOne({user_id: card.user_id, previous: prevID})
      .then(found=>{
        i++;
        if(i<index && found.next !== 'null'){
          return findNext(found._id);
        }
        else{
          return insertAfter(card, found._id);}
      });  
  };
  return   findNext();
      
};

const populateCards = (_id) =>{

    let index = 0;

    async function iterate (cardArr, index) {
      
      if(index === cardArr.length){
        return new Promise((resolve)=>{
          resolve()
        })
      }
  
      if(index === cardArr.length){
        return;
      }
      const cardTemplate = cardArr[index];
      cardTemplate.user_id = _id;
  
      let done = await insertAfter(cardTemplate)
      return (iterate(cardArr, index +1));
    }
  
    return iterate(cardArr, index);
  
  };


module.exports = {populateCards, insertAfter, insertAt, popCard};