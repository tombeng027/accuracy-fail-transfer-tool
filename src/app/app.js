const { BrowserWindow } = require('electron').remote;
const remote = require('electron').remote;
const path = require('path');
const $ = require('jquery');
const fs = require('fs');

let table = $('#nodeTable');
let content = $('#content');
let transferButton = $('#transferButton');
let totalElements = $('#totalElements');
let sampleSize = $('#sampleSize');
let sample = $('#sample');
let proceedModal = $('#proceedModal');
let yesButton = $('#yesButton');
let noButton = $('#noButton');

var config =  JSON.parse(fs.readFileSync('./src/environment/config/config.json'));
var matrix = fs.readFileSync('./src/assets/sampling_matrix.tsv').toString();

let pass1 = 1;
let pass2 = 2;
let fileCompare = 3;
let accuracy = 4;
let addressQA = 5;
let others = 6;
//BPO variables
//variables for replacing dynamic variables in httprequests
let domainVar = 'domain';
let portVar = 'port';
let contextRootVar = 'contextroot';
let nodeIdVar = 'nodeid';
let elementIdVar = 'elementid';
//variables from config
let domain = config.BPO.domain;
let port = config.BPO.port;
let contextRoot = config.BPO.contextroot;
let nodeIdArray = config.BPO.otherNodes.split('\|');
let detail = 'SAMPLE';
let pass1node = config.BPO.pass1;
let pass2node = config.BPO.pass2;
let fileComparenode = config.BPO.fileCompare;
let accuracynode = config.BPO.accuracy;
let addressQAnode = config.BPO.addressqa;
let accuracyElements = 0;

function initialize(){
    content.load('./app/tableContent/tableContent.html',()=>{
        setTimeout(updateTable,100);
        setInterval(updateTable,3000);
    });
    // transferButton.attr('disabled','true'); 
    transferButton.on('click',()=>{
        proceedModal.css('visibility','visible');
    });  
    noButton.on('click',()=>{
        proceedModal.css('visibility','hidden');
    });
    yesButton.on('click',transferElements);
}

async function transferElements(){
    transferButton.attr('disabled','true');
    proceedModal.css('visibility','hidden');
    let nodes = [];
    nodes = nodes.concat(nodeIdArray);
    nodes.push(pass1node);
    nodes.push(pass2node);
    nodes.push(fileComparenode);
    nodes.push(accuracynode);
    nodes.push(addressQAnode);
    
    for(let i in nodes){
        let node = await getNode(nodes[i]);
        for(let o in node.elements){
            if(node.elements[o].extraDetails[detail] == "false"){
                let transferQuery = config.BPO.transferElement.replace(nodeIdVar,node.nodeId)
                    .replace(domainVar,domain).replace(portVar,port).replace(contextRootVar,contextRoot)
                    .replace(elementIdVar,node.elements[o].elementId);
                let inputJson = {queueIndex:node.elements[o].queueIndex,priority:node.elements[o].priority};
                $.postJSON(transferQuery,inputJson).done();
            }
        }
    }
    //for handling elements not yet done with pass 1
    // setInterval(async ()=>{
    //     let node = await getNode(addressQAnode);
    //     for(let o in node.elements){
    //         if(node.elements[o].extraDetails[detail] == "false"){
    //             let transferQuery = config.BPO.transferElement.replace(nodeIdVar,node.nodeId)
    //                 .replace(domainVar,domain).replace(portVar,port).replace(contextRootVar,contextRoot)
    //                 .replace(elementIdVar,node.elements[o].elementId);
    //             let inputJson = {queueIndex:node.elements[o].queueIndex,priority:node.elements[o].priority};
    //             $.postJSON(transferQuery,inputJson).done();
    //         }
    //     }
    //     console.log(node.elements.length)
    // },3000);
    return;
}

//for requesting with POST method
$.postJSON = function(url, data, callback) {
    return $.ajax({
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        type: 'POST',
        url: url,
        data: JSON.stringify(data),
        dataType: 'application/json',
        success: callback
    });
};

async function getNode(nodeid){
    let node = await new Promise((resolve,reject)=>{
        $.get( config.BPO.getElementsInNode.replace(nodeIdVar,nodeid).replace(domainVar,domain)
            .replace(portVar,port).replace(contextRootVar,contextRoot)).done(resolve).fail((result)=>{
                alert('error ' + result.responseJSON.errorCode);
                window.close();
        });
    });
    return node;
}

function getSampleStatistics(total){
    var x = matrix.split('\n');
    for (var i=0; i<x.length; i++) {
        y = x[i].split('\t');
        x[i] = y;
    }
    for(let n in x){
        if(total < x[n][0]){
            totalElements[0].innerHTML = x[n][0];
            sampleSize[0].innerHTML = x[n][2];
            sample[0].innerHTML = x[n][3];
            break;
        }
    }
}

async function updateTable(){   
    console.log('1')
    await getOtherNodes();
    await getDefinedNodes(pass1node,pass1);
    await getDefinedNodes(pass2node,pass2);
    await getDefinedNodes(fileComparenode,fileCompare);
    await getDefinedNodes(accuracynode,accuracy);
    await getDefinedNodes(addressQAnode,addressQA);
    if(accuracyElements > sampleSize){
        transferButton.attr('disabled',false);
    }
    getTotal();
}

async function getDefinedNodes(nodeid,nodeindex){
    let nodeSamples = 0;
    let nodeNotSamples = 0;
    let nodeUndefined = 0;
    let nodeElements;
    node  = await getNode(nodeid);
    nodeElements = node.elements;
    for(let i in nodeElements){
        if(nodeElements[i].extraDetails[detail] == 'true'){
            nodeSamples++;
            if(nodeid == accuracynode){
                accuracyElements++;
            }
        }else if(nodeElements[i].extraDetails[detail] == 'false'){
            nodeNotSamples++;
        }else{
            nodeUndefined++;
        }
    }
    assignVariables(nodeindex,1,nodeSamples);
    assignVariables(nodeindex,2,nodeNotSamples);
    assignVariables(nodeindex,3,nodeUndefined);
}

async function getOtherNodes(){
    let otherNodeSamples = 0;
    let otherNodeNotSamples = 0;
    let otherNodeUndefined = 0;
    let otherNodeElements;
    for(let x in nodeIdArray){
        node  = await getNode(nodeIdArray[x]);
        otherNodeElements = node.elements;
        for(let i in otherNodeElements){
            if(otherNodeElements[i].extraDetails[detail] == 'true'){
                otherNodeSamples++;
            }else if(otherNodeElements[i].extraDetails[detail] == 'false'){
                otherNodeNotSamples++;
            }else{
                otherNodeUndefined++;
            }
        }
    }
    
    assignVariables(6,1,otherNodeSamples);
    assignVariables(6,2,otherNodeNotSamples);
    assignVariables(6,3,otherNodeUndefined);
}

function assignVariables(row, data, value){
    if((row > 0 & row < 9) & (data > 0 & data < 4)){
        table[0].rows[row].cells[data].innerHTML = value;
    }
}

function getTotal(){
    let sampleTotal = 0;
    let notSampleTotal = 0;
    let undefinedTotal = 0;
    let overallTotal = 0;
    for(let x = 1; x < 7; x++){
        if(!isNaN(parseInt(table[0].rows[x].cells[1].innerHTML))){
            sampleTotal += parseInt(table[0].rows[x].cells[1].innerHTML);
        }
        if(!isNaN(parseInt(table[0].rows[x].cells[2].innerHTML))){
            notSampleTotal += parseInt(table[0].rows[x].cells[2].innerHTML);
        }
        if(!isNaN(parseInt(table[0].rows[x].cells[3].innerHTML))){
            undefinedTotal += parseInt(table[0].rows[x].cells[3].innerHTML);
        }
    }
    overallTotal = sampleTotal + notSampleTotal + undefinedTotal;
    assignVariables(7,1,sampleTotal);
    assignVariables(7,2,notSampleTotal);
    assignVariables(7,3,undefinedTotal);
    assignVariables(8,1,overallTotal);
    getSampleStatistics(overallTotal);
}


$(document).ready(initialize);