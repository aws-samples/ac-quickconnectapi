
var credentials;
var secretKey;
var accessKey;
var sessionId;
var connect;
var qcListTable;
var qcList;
var selectedQC;
var selectedId;
var queueList;
var userList;
var cfList;
var timerID;
var dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion, dlgInstanceId;
const GCREATE = 'CREATE';
const GMODIFY = 'MODIFY';
const GVOICE = 'VOICE';
const GCHAT = 'CHAT';
const GSTANDARD = 'STANDARD';

// allowed will be CREATE and MODIFY
var currentOperation = GCREATE;

$( document ).ready(function() {
    if (!checkCookie()) {
        setAWSConfig(dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion);
        setupAll();
    } else {
        setupAll();
        $( "#configDialog" ).dialog( "open" );
    }
});

function setupAll() {
    loadConnectAPIs();

    $("#modifyQC").click(() => {
        currentOperation=GMODIFY;
        clear_form_elements('#qcForm');
        $("#btnCreate").hide();
        $("#btnRename").show();
        $("#btnUpdateConfig").show();        
        $( "#qcDialog" ).dialog( "open" );
        modifyQC(selectedId);
    });
    
        
    $("#listQC").click(() => {
        getListQuickConnects();
    });
    
    $("#btnUpdateConfig").click(() => {
        updateQCConfig();
    });
    
    
    $("#createQC").click(() => {
        currentOperation=GCREATE;
        clear_form_elements('#qcForm');
        $("#btnCreate").show();
        $("#btnRename").hide();
        $("#btnUpdateConfig").hide();
    	$('#qcQueueList').show();
    	$('#qcAgentList').hide();
    	$('#qcTFN').hide();
        $( "#qcDialog" ).dialog( "open" );
    });
    
    $("#describeQC").click(() => {
        describeQC(selectedId);
    });
    $("#btnRename").click(() => {
        renameQC(selectedId);
    });
    
        
    $("#deleteQC").click(() => {
        $( "#confirmDialog" ).dialog( "open" );
    });
    $("#btnCreate").click(() => {
        createQC();
        $( "#qcDialog" ).dialog( "close" );
    });
    
    $("#awsConfiguration").click(() => {
        $( "#configDialog" ).dialog( "open" );
    });
    
    $("#btnConfiguration").click(() => {
        if (saveCookie()) {
            $( "#configDialog" ).dialog( "close" );
        } else {
            $( "#configDialog" ).dialog( "open" );
        }
    });

    $("#searchQC").click(() => {
      $( "#dlgSearchQC" ).dialog( "open" );
    });
    
    $("#btnSearchQC").click(() => {
      btnSearchQC();
    });
    
    $("#searchQCByTags").click(() => {
      $( "#dlgSearchQCByTags" ).dialog( "open" );
    });
    
    $("#btnSearchQCsByTags").click(() => {
      btnSearchQCsByTags();
    });
    $("#btnAddRow").click(() => {
      btnAddRow();
    });

    $("#dlgSearchQCByTags").dialog({
        autoOpen: false,
        width: 800,
        modal: true,
        resizable: false,
        height: "auto"        
        
    });
    $('#dlgSearchQC').dialog({
        autoOpen: false,
        width: 850,
        modal: true,
        resizable: false,
        height: "auto"        
    });
       
    $("#dialog").dialog({
        autoOpen: false,
        modal: true
      });
    
    $("#qcDialog").dialog({
        autoOpen: false,
        width: 1300,
        modal: true,
        resizable: false,
        height: "auto"        
        
    });
    
    $("#resultDialog").dialog({
        autoOpen: false,
        modal: true
    });

    
    $('#configDialog').dialog({
        autoOpen: false,
        width: 850,
        modal: true,
        resizable: false,
        height: "auto"        
    });

    
    $( "#confirmDialog" ).dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
          "Yes": function() {
            $( this ).dialog( "close" );
            deleteQC(selectedId);
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          }
        }
    });        
    
    qcListTable = $('#qcListTable').DataTable({
        columnDefs: [
            {
                targets: -1,
                className: 'dt-body-right'
            }
          ],        
        columns: [{title: "Name"},{title: "Type"}],
        select: true,
        paging: false,
        info: false,
        searching: false
    });
    
    qcListTable.on( 'select', function ( e, dt, type, indexes ) {
        if ( type === 'row' ) {
            selectedQC = qcListTable.rows( indexes ).data()[0][0];
            $('#selectedQC').val(selectedQC);
            for (var i=0; i< qcList.QuickConnectSummaryList.length; i++) {
                if (selectedQC === qcList.QuickConnectSummaryList[i].Name) {
                    selectedId = qcList.QuickConnectSummaryList[i].Id;
                    break;
                }
            }
        }
    });
    
    $('#qcTypeList').on('change', function() {
    	  //alert( this.value );
    	if(this.value === 'QUEUE') {
        	populateQueueList('STANDARD', "1");
        	populateContactFlow('QUEUE_TRANSFER', "1");
        	$('#qcQueueList').show();
        	$('#qcQueueFlow').show();
        	$('#qcAgentList').hide();
        	$('#qcTFN').hide();
    		
    	} else if (this.value === 'USER') {
        	populateContactFlow('AGENT_TRANSFER', "1");
        	populateUserList("1");
        	$('#qcQueueList').hide();
        	$('#qcQueueFlow').show();
        	$('#qcAgentList').show();
        	$('#qcTFN').hide();
    		
    	} else {
        	$('#qcQueueList').hide();
        	$('#qcAgentList').hide();
        	$('#qcQueueFlow').hide();        	
        	$('#qcTFN').show();
    	}
    });    
    getListQuickConnects();
        
}

function btnAddRow(){
    try{
        var trow = '<tr><td><input name="txtTagName" class ="txtTagName" type="text" id="txtTagName" placeholder="Tag Name"></td>"';
        trow += '<td><input name="txtTagValue"  class="txtTagValue" type="text" id="txtTagValue" placeholder="Tab Value"></td>';
        trow += '<td><input name="btnDeleteRow" type="button" class="btnDeleteRow" id="btnDeleteRow" value="Delete"></tr>'; 
        $('#tblQCSearchByTags tbody').append(trow);        
    } catch(e) {
        console.log(e);        
    }
}

$(document).on("click",'.btnDeleteRow',function(){
   $(this).closest('tr').remove(); 
});

async function  btnSearchQCsByTags(){
    try{
            handleWindow(true, '');
            var searchFilter = {};
            searchFilter['TagFilter'] = {};
            var conditionType = $('#QCSearchType3').val();       
            //var conditionType = "TagCondition";
            //var conditionType = "AndConditions";
            //var conditionType = "OrConditions";
            searchFilter['TagFilter'][conditionType] = {};
            searchFilter['TagFilter'][conditionType] = [];
            
            $('#tblQCSearchByTags > tbody  > tr').each(function(index, tr) { 
                var tag = {};
                var tagKey = $(tr).find('.txtTagName').val();
                var tagValue = $(tr).find('.txtTagValue').val();
                tag = tagCondition(tagKey, tagValue);
                var conditions = [];
                conditions.push(tag);
                
                if(conditionType === 'OrConditions'){
                    searchFilter['TagFilter'][conditionType].push(conditions);  
                } else if(conditionType === 'AndConditions'){
                    searchFilter['TagFilter'][conditionType].push(tag);
                }
                else{
                    searchFilter['TagFilter'][conditionType] = tag;
                }
                
            });                        
            var ph = await searchQuickConnects(dlgInstanceId, null, 100, searchFilter, null);
            console.log(ph);        
            formatJSON(ph, '#rpFormatted');
            $( "#dlgSearchQCByTags" ).dialog( "close" );
            handleWindow(false, '');
            
               
    } catch(e) {
        console.log(e);        
    }
    
}


async function btnSearchQC(){
    try {
        handleWindow(true, '');
        var searchCriteria = {};        
        var conditions = [];
        var sc1 = {};        
        var cond2 = [];        
        cond2.push(condition('StringCondition', 'Name', $("#QCSearchName").val(), 'ComparisonType', $("#QCSearchType").val()));
        if($("#QCSearchName2").val().length > 1)
            cond2.push(condition('StringCondition', 'Name', $("#QCSearchName2").val(), 'ComparisonType', $("#QCSearchType2").val()));
        sc1['OrConditions'] = cond2;
        conditions.push(sc1);
        searchCriteria['OrConditions'] = conditions;
        var ph = await searchQuickConnects(dlgInstanceId, null, 100, null, searchCriteria);
        console.log(ph);        
        formatJSON(ph, '#rpFormatted');
        $( "#dlgSearchQC" ).dialog( "close" );
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
}

function condition(cond, fieldName, fieldValue, type, typeDetails) {
    var sc = {};
    sc[cond] = {};
    if(fieldName)
        sc[cond]['FieldName'] = fieldName;
    sc[cond]['Value'] = fieldValue;
    sc[cond][type] = typeDetails;
    return sc;
}

function tagCondition(tagName, tagValue, tagConditionOperator) {
    var sc = {};    
    sc['TagKey'] = tagName;
    sc['TagValue'] = tagValue; 
    //sc['TagConditionOperator'] = tagConditionOperator;
    return sc;
}

async function renameQC() {
    try {
        handleWindow(true, '');        
        let resp = await updateQuickConnectName(dlgInstanceId, selectedId, $('#qcName').val(), $('#qcDescription').val());
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        getListQuickConnects();
        handleWindow(false, '');
        $( "#qcDialog" ).dialog( "close" );
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}
async function updateQCConfig(){
    try {
        handleWindow(true, '');
        var qcc = {};
        var qcType = $('#qcTypeList').val();
        
        qcc['QuickConnectType'] = qcType;
        if(qcType === 'QUEUE') {
            qcc['QueueConfig'] = {};
            qcc['QueueConfig']['ContactFlowId'] = $('#qcQueueFlow').val();
            qcc['QueueConfig']['QueueId'] = $('#qcQueueList').val();
        } else if(qcType === 'USER') {

            qcc['UserConfig'] = {};
            qcc['UserConfig']['ContactFlowId'] = $('#qcQueueFlow').val();
            qcc['UserConfig']['UserId'] = $('#qcAgentList').val();
        	
        } else {
            qcc['PhoneConfig'] = {};
            qcc['PhoneConfig']['PhoneNumber'] = $('#qcTFN').val();
        }
        
        let resp = await updateQuickConnectConfig(dlgInstanceId, selectedId, qcc);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}

async function modifyQC() {
    try {
        handleWindow(true, '');
        var resp = await describeQuickConnect(dlgInstanceId, selectedId);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        $('#qcName').val(resp.QuickConnect.Name);
        $('#qcDescription').val(resp.QuickConnect.Description);
        $('#qcTypeList').val(resp.QuickConnect.QuickConnectConfig.QuickConnectType);
        if(resp.QuickConnect.QuickConnectConfig.QuickConnectType === 'QUEUE') {
        	$('#qcQueueList').show();
        	$('#qcAgentList').hide();
        	$('#qcTFN').hide();
        	populateQueueList('STANDARD', resp.QuickConnect.QuickConnectConfig.QueueConfig.QueueId);
        	populateContactFlow('QUEUE_TRANSFER', resp.QuickConnect.QuickConnectConfig.QueueConfig.ContactFlowId);
        } else if(resp.QuickConnect.QuickConnectConfig.QuickConnectType === 'USER') {
        	$('#qcQueueList').hide();
        	$('#qcAgentList').show();
        	$('#qcTFN').hide();
        	populateUserList(resp.QuickConnect.QuickConnectConfig.UserConfig.UserId);
        	populateContactFlow('AGENT_TRANSFER', resp.QuickConnect.QuickConnectConfig.UserConfig.ContactFlowId);
        	
        } else {
        	$('#qcQueueList').hide();
        	$('#qcAgentList').hide();
        	$('#qcTFN').show();
        }
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }	
}

function populateContactFlow(flowType, selectId) {
	$('#qcQueueFlow').empty();
    for(var i=0; i < cfList.ContactFlowSummaryList.length; i++){
    	var j = cfList.ContactFlowSummaryList[i];
    	if(j.ContactFlowType === flowType) {
    		if(j.Id == selectId) {
    			$('#qcQueueFlow').append('<option selected value="' +  j.Id + '">' + j.Name +'</option>');
    		} else {
    			$('#qcQueueFlow').append('<option value="' +  j.Id + '">' + j.Name +'</option>');	
    		}
    		
    	}
    }
}
function populateQueueList(queueType, selectId) {
	$('#qcQueueList').empty();
    for(var i=0; i < queueList.QueueSummaryList.length; i++){
    	var j = queueList.QueueSummaryList[i];
    	if(j.QueueType === queueType) {
    		if(j.Id == selectId) {
    			$('#qcQueueList').append('<option selected value="' +  j.Id + '">' + j.Name +'</option>');
    		} else {
    			$('#qcQueueList').append('<option value="' +  j.Id + '">' + j.Name +'</option>');	
    		}
    		
    	}
    }
    
}
function populateUserList(selectId) {
	$('#qcAgentList').empty();
    for(var i=0; i < userList.UserSummaryList.length; i++){
    	var j = userList.UserSummaryList[i];
		if(j.Id == selectId) {
			$('#qcAgentList').append('<option selected value="' +  j.Id + '">' + j.Username +'</option>');
		} else {
			$('#qcAgentList').append('<option value="' +  j.Id + '">' + j.Username +'</option>');	
		}
    }
}

async function createQC() {
    try {
        handleWindow(true, '');
        var qcc = {};
        var qcType = $('#qcTypeList').val();
        var name = $('#qcName').val();
        var desc = $('#qcDescription').val();
        
        qcc['QuickConnectType'] = qcType;
        if(qcType === 'QUEUE') {
            qcc['QueueConfig'] = {};
            qcc['QueueConfig']['ContactFlowId'] = $('#qcQueueFlow').val();
            qcc['QueueConfig']['QueueId'] = $('#qcQueueList').val();
        } else if(qcType === 'USER') {

            qcc['UserConfig'] = {};
            qcc['UserConfig']['ContactFlowId'] = $('#qcQueueFlow').val();
            qcc['UserConfig']['UserId'] = $('#qcAgentList').val();
        	
        } else {
            qcc['PhoneConfig'] = {};
            qcc['PhoneConfig']['PhoneNumber'] = $('#qcTFN').val();
        }
        
        let resp = await createQuickConnect(dlgInstanceId, name, desc, qcc);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}
async function deleteQC() {
    try {
        handleWindow(true, '');
        var resp = await deleteQuickConnect(dlgInstanceId, selectedId);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        handleWindow(false, '');
        getListQuickConnects();
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}
async function describeQC() {
    try {
        handleWindow(true, '');
        var resp = await describeQuickConnect(dlgInstanceId, selectedId);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}

async function getListQuickConnects() {
    try {
        handleWindow(true, '');
        qcList = await listQuickConnects(dlgInstanceId);
        console.log(qcList);
        queueList = await listQueues(dlgInstanceId);
        console.log(queueList);
        userList = await listUsers(dlgInstanceId);
        console.log(userList);
        cfList = await listContactFlows(dlgInstanceId);
        console.log(cfList);
        $('#qcQueueList').empty();
        $('#qcAgentList').empty();
        $('#qcQueueFlow').empty();

        formatJSON(qcList, '#rpFormatted');
        qcListTable.clear();
        for (var i=0; i< qcList.QuickConnectSummaryList.length; i++) {
            var value = qcList.QuickConnectSummaryList[i];
            qcListTable.row.add([value.Name, value.QuickConnectType]);
        }
        qcListTable.draw();
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
    
}


const updateQuickConnectConfig = (instanceId, quickConnectId, quickConnectConfig ) => {
    return new Promise((resolve,reject) => {
        var params = {InstanceId : instanceId, QuickConnectId : quickConnectId, QuickConnectConfig : quickConnectConfig};       
        console.log(params);
        connect.updateQuickConnectConfig(params, function (err, res) {        
             if (err) 
                  reject(err);
              else 
                 resolve(res);
         });
     });
 }

const updateQuickConnectName = (instanceId, quickConnectId, name, description ) => {
    return new Promise((resolve,reject) => {
        var params = {InstanceId : instanceId, QuickConnectId : quickConnectId, Name : name, Description : description };       
        console.log(params);
        connect.updateQuickConnectName(params, function (err, res) {        
             if (err) 
                  reject(err);
              else 
                 resolve(res);
         });
     });
 }

const createQuickConnect  = (instanceId, name, description, quickConnectConfig ) => {
    return new Promise((resolve,reject) => {
        var params = {InstanceId : instanceId, Name : name, Description : description, QuickConnectConfig : quickConnectConfig };       
        console.log(params);
        connect.createQuickConnect(params, function (err, res) {        
             if (err) 
                  reject(err);
              else 
                 resolve(res);
         });
     });
 }

const deleteQuickConnect = (instanceId, quickConnectId ) => {
    return new Promise((resolve,reject) => {
        var params = {InstanceId : instanceId, QuickConnectId : quickConnectId };       
        console.log(params);
        connect.deleteQuickConnect(params, function (err, res) {        
             if (err) 
                  reject(err);
              else 
                 resolve(res);
         });
     });
 }

const describeQuickConnect = (instanceId, quickConnectId ) => {
    return new Promise((resolve,reject) => {
        var params = {InstanceId : instanceId, QuickConnectId : quickConnectId };       
        console.log(params);
        connect.describeQuickConnect(params, function (err, res) {        
             if (err) 
                  reject(err);
              else 
                 resolve(res);
         });
     });
 }

const listQuickConnects = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listQueues = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listQueues(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listUsers = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listUsers(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listContactFlows = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listContactFlows(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const searchQuickConnects = (instanceId, nextToken, maxResults, searchFilter, searchCriteria) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, NextToken : nextToken, MaxResults : maxResults, SearchFilter: searchFilter, SearchCriteria: searchCriteria};       
           console.log(params);
           connect.searchQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

function showResults(message){
    $('#resultSpan').text(message);
    $("#resultDialog").dialog("open");
}

function loadConnectAPIs() {
	//connect = new AWS.Connect({ region: "us-west-2", endpoint: "https://91am9nwnzk.execute-api.us-west-2.amazonaws.com/Prod" }, {apiVersion: '2017-08-08'});
	connect = new AWS.Connect({ region: dlgSourceRegion});
}


function handleWindow(openClose, text) {
    if(openClose == true) {
        $( "#dialog" ).dialog( "open" );
    } else {
        $( "#dialog" ).dialog( "close" );
    }

    if(text.length>1) {
        $('#waitingSpan').text(text);
    } else {
        $('#waitingSpan').text('    Waiting for server to respond');
    }
}

function setAWSConfig(accessKey, secretKey, rgn) {

    AWS.config.update({
        accessKeyId: accessKey, secretAccessKey: secretKey, region: rgn
    });    
    AWS.config.credentials.get(function (err) {
        if (err)
            console.log(err);
        else {
            credentials = AWS.config.credentials;
            getSessionToken();
        }
    });
    
}

function formatJSON(data, element) {
    $(element).html(prettyPrintJson.toHtml(data));
}


function getSessionToken() {
    var sts = new AWS.STS();
    sts.getSessionToken(function (err, data) {
      if (err) console.log("Error getting credentials");
      else {
          secretKey = data.Credentials.SecretAccessKey;
          accessKey = data.Credentials.AccessKeyId;
          sessionId = data.Credentials.SessionToken;
      }
    });
}

function clear_form_elements(ele) {
    $(':input',ele)
      .not(':button, :submit, :reset')
      .val('')
      .prop('checked', false)
      .prop('selected', false);
}

function saveCookie() {
    dlgSourceAccessKey=$("#dlgSourceAccessKey").val();
    dlgSourceSecretKey=$("#dlgSourceSecretKey").val();
    dlgSourceRegion=$("#dlgSourceRegion").val();
    dlgInstanceId = $("#dlgInstanceId").val();
    if(!checkAllMandatoryFields()) {
        setCookie("dlgSourceAccessKey", dlgSourceAccessKey,100);
        setCookie("dlgSourceSecretKey", dlgSourceSecretKey,100 );
        setCookie("dlgSourceRegion", dlgSourceRegion,100);
        setCookie("dlgInstanceId", dlgInstanceId,100);
        $('#spnAWSMessage').text('');
        setAWSConfig(dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion);
        return true;
    }else{
        $('#spnAWSMessage').text('All fields are mandatory and cannot be whitespaces or null');        
        return false;
    }
}

function getCookie(c_name)
{
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x===c_name)
        {
          return unescape(y);
        }
     }
}

function setCookie(c_name,value,exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
}

function checkCookie()
{
    dlgSourceAccessKey=getCookie("dlgSourceAccessKey");
    dlgSourceSecretKey=getCookie("dlgSourceSecretKey");
    dlgSourceRegion=getCookie("dlgSourceRegion");
    dlgInstanceId=getCookie("dlgInstanceId");
    $('#dlgSourceAccessKey').val(dlgSourceAccessKey);
    $('#dlgSourceSecretKey').val(dlgSourceSecretKey);
    $('#dlgSourceRegion').val(dlgSourceRegion);
    $('#dlgInstanceId').val(dlgInstanceId);
    
    return checkAllMandatoryFields();
}

function checkAllMandatoryFields() {
    if(isBlank(dlgSourceAccessKey) || dlgSourceAccessKey.isEmpty() || 
            isBlank(dlgSourceSecretKey) || dlgSourceSecretKey.isEmpty() || 
            isBlank(dlgSourceRegion) || dlgSourceRegion.isEmpty() ||
            isBlank(dlgInstanceId) || dlgInstanceId.isEmpty()
            ) {
        return true;
    }else
        return false;
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};