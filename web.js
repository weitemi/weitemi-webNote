//��ʼ�����λ������Ϣ
var $advertisementGrid;

//����ҳ���ϵı�����У��
HAF.Form.setValidate({
    els:{
        "orderNo": {required:true,type:'number'},
        "type": {required:true}
    }
});
$(function (){

	//��ʼ��ҳ��������İ�ť
	HAF.Form.init({
        defButtons:[],
        buttons:[
            {label:"������Ŀ",clsName:"btn-info",handle:function(){
				//���л��ռ�ҳ��������input��ֵ
                var categoryData = HAF.Form.formToJson("#categoryForm");
                if(validate()){
                    saveCategory(categoryData, function(categoryData){
                        if(categoryData.id){
                            alert("����ɹ�");
                            window.opener=null;
                            window.open('','_self');
                            window.close();
                        }
                    });
                }
            }}
        ]
    });
	//��ȡУ����
	function validate(){
        var flag = true;
        if(!HAF.Form.validate()){
            flag = false;
        }
		//��ӻ�������У��֮���У��
        if(HAF.Form.validate()&&!($("#type").val()=='��Ŀ')&&$("#link").val()==''){
            alert("����д���ӵ�ַ");
            flag = false;
        }
        return flag;
    }

	//��ʼ��inputΪ�ϴ�����
    HAF.Form.uploadify("#attachment",{editable:true,enableUsed:true,enableSelect:true,singleSelect:false});
	//��ʼ��input������
	HAF.Form.downList("#isNeedStaticCategory",{
        editable:false,
	//        maxHeight:"80px",
        data:[["��","��"],["��","��"]]});

    var gridOptions = {
        width: "100%",
        height:"540px",
        singleSelect:true,
        pagination:true,
        rownumbers:true,
        fitColumns:true,
        url: HAF.basePath()+"/cms/advertisement/list/getAllList.do",
        //queryParams: {appId: id},
        searchParams: [
            {name:"lockStatus",type:"hidden",defaultValue:"2"},
            {label: "����״̬",labelWidth:"2",name:"lockStatusText",type:"downlist",readonly:false,options:{
                data:[["","ȫ������"],["0","�ݸ�"],["1","������"],["2","�������"]],
                valueField:"[name='lockStatus']",textField:"[name='lockStatusText']",editable:false
            }}
        ],
        columns: [
            {field:'id',checkbox:true},
            {field:'lockStatus',title:'����״̬',width:90,align:'center'},
            {field:'deleteStatus',title:'ɾ��״̬',width:90,align:'center'},
            {field:'createDate',title:'����ʱ��',width:90,align:'center'},
            {field:'createUser',title:'������',width:90,align:'center'},
            {field:'updateDate',title:'�޸�ʱ��',width:90,align:'center'},
            {field:'updateUser',title:'�޸���',width:90,align:'center'},
        ],
        toolbar: ['-',{
            text: "����",
            handler: function(){
                editAdvertisement("��ӹ��λ����", function(data){
                    saveAdvertisement(data, function(data){
                        $advertisementGrid.datagrid("appendRow",data).datagrid("acceptChanges");
                    });
                });
            }
        }, '-',{
            text: "ɾ��",
            handler: function(){
                var rows = $advertisementGrid.datagrid("getChecked");
                if(rows.length==0){
                    alert("��ѡ����Ҫɾ������");
                    return false;
                }
                var ids = [];
                $.each(rows,function(i,row){
                    if(row.id) ids.push(row.id);
                    var index = $advertisementGrid.datagrid("getRowIndex",row);
                    $advertisementGrid.datagrid("deleteRow",index).datagrid("acceptChanges");
                });
                //
                if(ids.length){
                    deleteAdvertisement(ids);
                }
            }
        } , '-', {
            iconCls: 'icon-redo',
            text: "����EXCEl����ҳ��",
            handler: function () {
                var page = $advertisementGrid.datagrid("options").pageNumber;
                var rows = $advertisementGrid.datagrid("options").pageSize;
                window.open(HAF.basePath()+"/cms/advertisement/exportExcel.do?type=page&page=" + page + "&rows=" + rows);
            }
        },'-', {
            iconCls: 'icon-redo',
            text: "����EXCEl��ȫ����",
            handler: function () {
                var rows = $advertisementGrid.datagrid("getData").total;
                window.open(HAF.basePath()+"/cms/advertisement/exportExcel.do?type=all&rows=" + rows);
            }
        } , '-', {
            iconCls: 'icon-redo',
            text: "����",
            handler: function () {
                HAF.Form.dataImportDialog({
                    submitUrl: "/cms/advertisement/import.do",
                    templateUrl: "/template/downloadTemplate.do?title=���λ������Ϣ&excelName=advertisement",
                    contentType : 'application/json',
                    success: function(data){
                        if(data){
                            alert(data.msg);
                            $advertisementGrid.datagrid('reload');
                        }
                    },
                    error: function(msg){
                        alert(msg);
                    }
                });

            }
        }],
        onDblClickRow: function(rowIndex, rowData){
            editAdvertisement("���λ������Ϣ", function(data){
                saveAdvertisement(data, function(data){
                    $advertisementGrid.datagrid("updateRow",{index:rowIndex,row:data})
                        .datagrid("acceptChanges");
                });
            }, rowData);
        }
    };
	
	//$.extend(gridOptions,{
    //    toolbar: [{},{}]
	//});

    $advertisementGrid = HAF.Form.searchGrid("#advertisementGrid",gridOptions);
});


//�༭���λ������Ϣ
function editAdvertisement(title, callback, row){

    HAF.Form.gridEditor({
		hidden:["categoriesId","lockStatus"],
        title: title,
        visible: [[
			    {label: "����",labelWidth:"2",name:"name",fieldWidth:"4",type:"date", readonly: false,options:{}} ,
                {label: "������",labelWidth:"2",name:"description",fieldWidth:"4",type:"inputgroup",options:{
                    editable:false,
                    handle:function($input,$form ){
                        HAF.dialog({
                            content:"<ul  id='resourceId'></ul >",
                            ready:function(dialog){
                                $('#resourceId').tree({
                                    checkbox:true,
//                                    onlyLeafCheck:true,
                                    cascadeCheck:false,//ȡ������ѡ��
                                    fit:true,
                                    nowrap: true,
                                    rownumbers: true,
                                    border: false,
                                    url:HAF.basePath()+'/cms/category/getCategoryTree.do',
                                    text:'text'
                                });
                            },
                            success:function(){
                                var rowStr = "";
                                var rowIdStr = "";
                                var rows  = $('#resourceId').tree('getChecked');
                                for(var i=0;i<rows.length;i++){
                                    if(i==rows.length-1){
                                        rowStr += rows[i].text;
                                        rowIdStr += rows[i].id;
                                    }else{
                                        rowStr += rows[i].text+",";
                                        rowIdStr += rows[i].id+",";
                                    }
                                }
                                $input.val(rowStr);//��ǰ�����ֵ
                                $form.find("[name='categoriesId']").val(rowIdStr);//����ID��ֵ
                            }
                        })
                    }
                }}
            ],
            [
			    {label: "ѡ�񵯿�",labelWidth:"2",name:"categoriesId",fieldWidth:"4",type:"inputgroup", readonly: false,options:{
                handle:function($input,$form){
                    HAF.Form.gridSelect({
                        gridUrl: "/recommend/list/getAllList.do",
//                            searchParams:[
//                                {name:"searchKey",label:"�ؼ���"},
//                                {name:"searchKeyName",label:"�ؼ�������"}
//                            ],
                        columns:[
                            {field:'id',checkbox:true},
                            {field:'name',title:'�Ƽ�λ����',width:90,align:'center'},
                            {field:'description',title:'����',width:90,align:'center'},
                            {field:'lockStatus',title:'����״̬',width:90,align:'center',formatter:function(value, row, index){
                                if (value == "0") return "����";
                                if (value == "1") return "����";
								}
							}
                        ],
                        idField:"id",
                        singleSelect:true,
                        selectedFieldShow:"name",
                        success:function(data){
                            $input.val(data[0].name);
                            $form.find("[name='recommendId']").val(data[0].id);
//                                datalist = data[0].express;
//                                HAF.Form.downList($form.find("[name=express]"),{
//                                    data:datalist
//                                });
                        }
                    });
                }
            }} ,
                {label: "�Ƽ�λչʾλ��",labelWidth:"2",name:"categoriesTitle",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "ִ����",labelWidth:"2",name:"handlerClazz",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "���ģ��",labelWidth:"2",name:"adTemplate",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "����״̬",labelWidth:"2",name:"lockStatusTxt",fieldWidth:"4",type:"downlist", readonly: false,options:{
                    data: [[1, '��'],[0, '��']],
                    valueField: "[name='lockStatus']", textField: "[name='lockStatusTxt']"
                }} ,
                {label: "ɾ��״̬",labelWidth:"2",name:"deleteStatus",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "����ʱ��",labelWidth:"2",name:"createDate",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "������",labelWidth:"2",name:"createUser",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "�޸�ʱ��",labelWidth:"2",name:"updateDate",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "�޸���",labelWidth:"2",name:"updateUser",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [

		]],
        rowData: row,
        callback: callback
    });
}

//�ϴ�����
function uploadFile(){
    HAF.Form.sampleUpload({
        title:"����ͼ�ϴ�",
        allowTypes: ["jpg","png","gif","bmp","jpeg"],
//        url: "${path}/upload/photo/upload.do", ���Զ���
        maxSize: 200,
        success: function(data){
            if(data){
                alert("����ͼ�ϴ��ɹ���");
//                alert(HAF.stringify(data)); ��ӡ������ֵ
                $("#thumbnail").val(data[0].id);
                $("#thumbnailPre").attr("src").val(HAF.basePath+"/oa/service/attach/download.do?id="+data[0].id);
            }
        },
        error:function(data){
            alert("�ϴ�ʧ�ܣ�");
        }
    });
}

//��ʼ��input��ʾtree�ĵ���
HAF.Form.inputGroup("#parentCategoryTitle",{
        handle:function(){
            HAF.dialog({
                key:"cms-category",
                title:"ѡ����Ŀ",
                width:"650px",
                height:"450px",
                content: "<div id='category-tree'></div>",
                ready:function($dialog){
					//����tree
                    showCategoryTree();
                },
                success:function($dialog){
                    /*if($dialog.find("[name='fiDocNumber']").val()!=""){
                        alert("ƾ֤�Ѿ����������β��ظ�ִ��");
                        return true;
                    }*/
					//��ֵ
                    $("#parentCategoryId").val($('#category-tree').tree("getSelected").id);
                    $("#parentCategoryTitle").val($('#category-tree').tree("getSelected").text);
                }
            });
        }
    });
	
/**
 * ���ز˵���
 */
function showCategoryTree(){
    //��ʼ����Դ������
    $("#category-tree").tree({
        url:HAF.basePath()+'/cms/category/getCategoryTree.do',
        method:"GET",
//        checkbox:true,
        cascadeCheck:false,//ȡ������ѡ��
        parentField:"pid",//��ID
        textFiled:"text", //��ʾ����
        idFiled:"id", //tree��Ӧ��ID
        lines:true,
        onBeforeExpand: function(node){
            if(node){
                $('#category-tree').tree('options').url = HAF.basePath()+"/cms/category/getCategoryTree.do";
            }
        },
        onLoadSuccess:function(node,data){
            var t = $(this);
            if(data){
				//չ������tree
                $(data).each(function(index,d){
                    if(this.state == 'closed'){
                        t.tree('expandAll');
                    }
                });
            }
        },
        onSelect : function(node){
			//��ѡһ��
            var cknodes = $(this).tree("getChecked");
            for(var i = 0 ; i < cknodes.length ; i++){
                $(this).tree("uncheck", cknodes[i].target);
            }
            //��ѡ�иĽڵ�
            $(this).tree("check", node.target);
        },
        onDblClick: function(node){
            $('#category-tree').tree('toggle',node.target);
        }
    });
}


//������λ������Ϣ
function saveAdvertisement(data,callback){
    HAF.ajax({
        url: HAF.basePath() + "/cms/advertisement/saveOrUpdate.do",
        contentType : 'application/json',
        data: HAF.stringify(data),
        success: function(rdata){
            if(rdata){
                $.extend(data, rdata);
                if(callback) callback(data);
            }else{
                alert("����ʧ�ܣ�δ����ɹ�");
            }
        }
    });
}

//ɾ�����λ������Ϣ
function deleteAdvertisement(ids,callback){
    HAF.ajax({
        url: HAF.basePath()+"/cms/advertisement/deleteByIds.do",
        contentType : 'application/json',
        data: HAF.stringify(ids),
        success: function(data){
            if(data && data.success){
                if(callback) callback();
            }
        }
    });
}