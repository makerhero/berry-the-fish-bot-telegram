/**
 * Bot para uso interno FF com telegram
 */
const TelegramBot = require('node-telegram-bot-api');
var rpio = require('rpio');
var moment = require('moment');
var fs = require('fs');

moment.locale('pt-br');

/*
*   declaração de variáveis
*/
const token = 'seu token telegram aqui';
const bot = new TelegramBot(token, {polling: true});
const chat_id = 'seu chat ID aqui';

var currentDate;

const LED = 18
const BUTTON = 7

// tempos de notificacao
const S_5   = 5
const S_10  = 10
const S_15  = 15
const S_30  = 30
const M_30  = 1800
const H_1   = 3600
const H_24  = 86400

// inicializa gpios
rpio.open(LED, rpio.OUTPUT, rpio.LOW);
rpio.open(BUTTON, rpio.INPUT);
rpio.pud(BUTTON, rpio.PULL_UP);

// banco de palavras
var hello = [
    "hi", "hello", "olá", "ola", "oi"
]
var bye = [
    "bye", "tchau", "até", "falou"
]
var especie = [
    "especie", "espécie", "tipo", "peixe", "raça"
]

/**
 *  Veifica mensagens Telegram
 */
bot.on('message', (msg) => {
    var botMsg = msg.text.toString().toLowerCase();
    const welcomeMsg = "Olá " + msg.from.first_name +`! Eu sou o Berry, peixe mascote da FILIPEFLOP!\n
Envie o comando /berry e te direi a hora que fui alimentado.
Quer saber qual a minha espécie? Pergunte: 'qual a sua espécie?'
Quer que te conte uma piada? hehe digite: 'conte uma piada'`;
    for(var i=0;i<=hello.length;i++) {
        if (botMsg.indexOf(hello[i]) >= 0) {
            bot.sendChatAction(msg.chat.id, "typing");
            setTimeout(function() {
                bot.sendMessage(msg.chat.id, welcomeMsg);  
            }, 3000);
        }
    }
    for(var i=0;i<=bye.length;i++) {
        if (botMsg.indexOf(bye[i]) >= 0) {
            bot.sendChatAction(msg.chat.id, "typing");
            setTimeout(function() {
                bot.sendMessage(msg.chat.id, "Falou amiguinho! Volte sempre :)");
            }, 1000);    
        }
    }
    if (botMsg.indexOf("piada") >= 0) {
        bot.sendChatAction(msg.chat.id, "typing");
        jokes[randomIntInc(0,5)](msg.chat.id);
    } 
    for(var i=0;i<=especie.length;i++)
    {
        if (botMsg.indexOf(especie[i]) >= 0) {
            bot.sendChatAction(msg.chat.id, "typing");
            setTimeout(function() {                
                bot.sendMessage(msg.chat.id, "eu sou um peixe Beta igual dessa foto aí!");  
            }, 2000);
            setTimeout(function() {
                bot.sendPhoto(msg.chat.id, "/home/pi/berry-the-fish-bot-telegram/bettafish.jpg");  
            }, 3000);
        } 
    }  
});

/**
 *  Verifica comandos Telegram
 */
bot.onText(/\/start/, (msg) => {
    const welcomeMsg = "Olá " + msg.from.first_name +`! Eu sou o Berry, peixe mascote da FILIPEFLOP!\n
Envie o comando /berry e te direi a hora que fui alimentado.
Quer saber qual a minha espécie? Pergunte: 'qual a sua espécie?'
Quer que te conte uma piada? hehe digite: 'conte uma piada'`;    
    bot.sendMessage(msg.chat.id, welcomeMsg);
    console.log(msg.chat.id);      
});
bot.onText(/\/berry/, (msg) => {    
    var dateFromFile = fs.readFileSync('/home/pi/berry-the-fish-bot-telegram/lastFoodDateTG.txt','utf8')
    console.log(dateFromFile);
    //if(currentDate == undefined) sendMessage("(berry) ainda não me deram comida :(", "green", false, "text");        
    //else sendMessage("(berry) me deram comida na " + dateFromFile, "yellow", false, "text");
    bot.sendChatAction(msg.chat.id, "typing");
    setTimeout(function() {
        bot.sendMessage(msg.chat.id, "me deram comida na " + dateFromFile);  
    }, 4000);
            
});

/** 
 *  Salva a data da alimentação em arquivo 
 */
function saveDateToFile(dateToSave) {
    fs.writeFile("/home/pi/berry-the-fish-bot-telegram/lastFoodDateTG.txt", dateToSave + "\n", function(err) {
        if(err) {
            return console.log(err);
        }    
        console.log("The file was saved");
    });
}
/**
 *  Verifica se o botão foi pressionado e pisca o LED salvando a data em arquivo
 */
setInterval(function() {
    //console.log('Button is currently set ' + (rpio.read(BUTTON) ? 'high' : 'low'));
    var state = rpio.read(BUTTON) ? 'released' : 'pressed';
    if(state == 'pressed') {
        console.log("Button pressed");
        bot.sendChatAction(chat_id, "typing");
        setTimeout(function() {
            bot.sendMessage(chat_id, "agora tenho comida!");
        }, 3000);
        currentDate = moment().format("LLLL");
        saveDateToFile(currentDate);
        notificationTime = H_24; // volta notificação para seu tempo inicial
        currentTime = new Date();       
        console.log(currentDate);
        var blinkLED = setInterval(function(){
            rpio.write(LED, rpio.read(LED) === 0 ? 1 : 0);
        }, 100);
        setTimeout(function() {
            clearInterval(blinkLED);
            rpio.write(LED, rpio.LOW);
        }, 2000);
        while(!rpio.read(BUTTON));
    }
}, 5);

/**
 *  função de notificação. Inicia com notificação a cada 24H e depois a cada 1H 
 */ 
var notificationTime = H_24; // tempo de notificação inicial
var currentTime = new Date();
var elapsedTime = 0;
setInterval(function () {
    if(currentDate == undefined) elapsedTime = 0;
    else elapsedTime = (new Date() - currentTime) / 1000;    
    if(elapsedTime >= notificationTime) {
        bot.sendChatAction(chat_id, "typing");
        setTimeout(function() {
            bot.sendMessage(chat_id, "quero comida!");
        }, 2000);
        rpio.write(LED, rpio.HIGH);
        notificationTime = H_1; // after 24 hours notification occurs each 1 hour, can be cutomized
        currentTime = new Date();
    }
}, 1000);

/**
 *  6 piadas pré programadas que são chamadas através de um número randômico de 0-5 
 */
function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
// six jokes for fun
var jokes = [
    function(chatID) { joke1(chatID); },
    function(chatID) { joke2(chatID); },
    function(chatID) { joke3(chatID); },
    function(chatID) { joke4(chatID); },
    function(chatID) { joke5(chatID); },
    function(chatID) { joke6(chatID); }
];
function joke1(chatID) {    
    setTimeout(function() {
        bot.sendMessage(chatID, "O que um peixe falou para o outro?");  
    }, 2000);        
    setTimeout(function() {
        bot.sendMessage(chatID, "'Nada' não... HAHAHA");
    }, 7000);   
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);
}
function joke2(chatID) {  
    setTimeout(function() {
        bot.sendMessage(chatID, "Por que o tubarão ficou chocado?");  
    }, 2000);        
    setTimeout(function() {
        bot.sendMessage(chatID, "Porque comeu um peixe-elétrico KKKKK");
    }, 7000);  
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);  
 } 
 function joke3(chatID) {
    setTimeout(function() {
        bot.sendMessage(chatID, "Como você chama um peixe famoso?");  
    }, 2000);       
    setTimeout(function() {
        bot.sendMessage(chatID, "Um peixe estrela HAUHAUH");
    }, 7000);
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);   
 } 
 function joke4(chatID) {
    setTimeout(function() {
        bot.sendMessage(chatID, "Um pexe pulou do 17° andar, qual o nome dele?");  
    }, 2000);         
    setTimeout(function() {
        bot.sendMessage(chatID, "aaaaaaaaaaaaaaaaa-tum");
    }, 7000);
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);   
 } 
 function joke5(chatID) {
    setTimeout(function() {
        bot.sendMessage(chatID, "Por que existe um peixe na nota de 100 reais?");  
    }, 2000);
    setTimeout(function() {
        bot.sendMessage(chatID, "Porque dinheiro que é bom 'nada' HEHEHEHE");
    }, 7000);
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);   
 } 
 function joke6(chatID) {
    setTimeout(function() {
        bot.sendMessage(chatID, "Como é que se pesca peixe pela internet?");
    }, 2000);  
    setTimeout(function() {
        bot.sendMessage(chatID, "Com a rede HUEHUEH");
    }, 7000);  
    setTimeout(function() {
        bot.sendChatAction(chatID, "typing");
    }, 3000);  
 }
