//初始化广告位管理信息
var $advertisementGrid;

//设置页面上的必填项校验
HAF.Form.setValidate({
    els:{
        "orderNo": {required:true,type:'number'},
        "type": {required:true}
    }
});
$(function (){

	//初始化页面最上面的按钮
	HAF.Form.init({
        defButtons:[],
        buttons:[
            {label:"保存栏目",clsName:"btn-info",handle:function(){
				//序列化收集页面上所有input的值
                var categoryData = HAF.Form.formToJson("#categoryForm");
                if(validate()){
                    saveCategory(categoryData, function(categoryData){
                        if(categoryData.id){
                            alert("保存成功");
                            window.opener=null;
                            window.open('','_self');
                            window.close();
                        }
                    });
                }
            }}
        ]
    });
	//获取校验结果
	function validate(){
        var flag = true;
        if(!HAF.Form.validate()){
            flag = false;
        }
		//添加基础必填校验之外的校验
        if(HAF.Form.validate()&&!($("#type").val()=='栏目')&&$("#link").val()==''){
            alert("请填写链接地址");
            flag = false;
        }
        return flag;
    }

	//初始化input为上传附件
    HAF.Form.uploadify("#attachment",{editable:true,enableUsed:true,enableSelect:true,singleSelect:false});
	//初始化input下拉框
	HAF.Form.downList("#isNeedStaticCategory",{
        editable:false,
	//        maxHeight:"80px",
        data:[["是","是"],["否","否"]]});

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
            {label: "锁定状态",labelWidth:"2",name:"lockStatusText",type:"downlist",readonly:false,options:{
                data:[["","全部类型"],["0","草稿"],["1","审批中"],["2","审批完成"]],
                valueField:"[name='lockStatus']",textField:"[name='lockStatusText']",editable:false
            }}
        ],
        columns: [
            {field:'id',checkbox:true},
            {field:'lockStatus',title:'锁定状态',width:90,align:'center'},
            {field:'deleteStatus',title:'删除状态',width:90,align:'center'},
            {field:'createDate',title:'创建时间',width:90,align:'center'},
            {field:'createUser',title:'创建人',width:90,align:'center'},
            {field:'updateDate',title:'修改时间',width:90,align:'center'},
            {field:'updateUser',title:'修改人',width:90,align:'center'},
        ],
        toolbar: ['-',{
            text: "新增",
            handler: function(){
                editAdvertisement("添加广告位管理", function(data){
                    saveAdvertisement(data, function(data){
                        $advertisementGrid.datagrid("appendRow",data).datagrid("acceptChanges");
                    });
                });
            }
        }, '-',{
            text: "删除",
            handler: function(){
                var rows = $advertisementGrid.datagrid("getChecked");
                if(rows.length==0){
                    alert("请选择需要删除的行");
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
            text: "导出EXCEl（本页）",
            handler: function () {
                var page = $advertisementGrid.datagrid("options").pageNumber;
                var rows = $advertisementGrid.datagrid("options").pageSize;
                window.open(HAF.basePath()+"/cms/advertisement/exportExcel.do?type=page&page=" + page + "&rows=" + rows);
            }
        },'-', {
            iconCls: 'icon-redo',
            text: "导出EXCEl（全部）",
            handler: function () {
                var rows = $advertisementGrid.datagrid("getData").total;
                window.open(HAF.basePath()+"/cms/advertisement/exportExcel.do?type=all&rows=" + rows);
            }
        } , '-', {
            iconCls: 'icon-redo',
            text: "导入",
            handler: function () {
                HAF.Form.dataImportDialog({
                    submitUrl: "/cms/advertisement/import.do",
                    templateUrl: "/template/downloadTemplate.do?title=广告位管理信息&excelName=advertisement",
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
            editAdvertisement("广告位管理信息", function(data){
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


//编辑广告位管理信息
function editAdvertisement(title, callback, row){

    HAF.Form.gridEditor({
		hidden:["categoriesId","lockStatus"],
        title: title,
        visible: [[
			    {label: "日期",labelWidth:"2",name:"name",fieldWidth:"4",type:"date", readonly: false,options:{}} ,
                {label: "树弹框",labelWidth:"2",name:"description",fieldWidth:"4",type:"inputgroup",options:{
                    editable:false,
                    handle:function($input,$form ){
                        HAF.dialog({
                            content:"<ul  id='resourceId'></ul >",
                            ready:function(dialog){
                                $('#resourceId').tree({
                                    checkbox:true,
//                                    onlyLeafCheck:true,
                                    cascadeCheck:false,//取消级联选中
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
                                $input.val(rowStr);//当前输入框赋值
                                $form.find("[name='categoriesId']").val(rowIdStr);//隐藏ID赋值
                            }
                        })
                    }
                }}
            ],
            [
			    {label: "选择弹框",labelWidth:"2",name:"categoriesId",fieldWidth:"4",type:"inputgroup", readonly: false,options:{
                handle:function($input,$form){
                    HAF.Form.gridSelect({
                        gridUrl: "/recommend/list/getAllList.do",
//                            searchParams:[
//                                {name:"searchKey",label:"关键字"},
//                                {name:"searchKeyName",label:"关键字名称"}
//                            ],
                        columns:[
                            {field:'id',checkbox:true},
                            {field:'name',title:'推荐位置名',width:90,align:'center'},
                            {field:'description',title:'描述',width:90,align:'center'},
                            {field:'lockStatus',title:'锁定状态',width:90,align:'center',formatter:function(value, row, index){
                                if (value == "0") return "正常";
                                if (value == "1") return "锁定";
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
                {label: "推荐位展示位置",labelWidth:"2",name:"categoriesTitle",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "执行类",labelWidth:"2",name:"handlerClazz",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "广告模板",labelWidth:"2",name:"adTemplate",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "锁定状态",labelWidth:"2",name:"lockStatusTxt",fieldWidth:"4",type:"downlist", readonly: false,options:{
                    data: [[1, '是'],[0, '否']],
                    valueField: "[name='lockStatus']", textField: "[name='lockStatusTxt']"
                }} ,
                {label: "删除状态",labelWidth:"2",name:"deleteStatus",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "创建时间",labelWidth:"2",name:"createDate",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "创建人",labelWidth:"2",name:"createUser",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [
			    {label: "修改时间",labelWidth:"2",name:"updateDate",fieldWidth:"4",type:"text", readonly: false,options:{}} ,
                {label: "修改人",labelWidth:"2",name:"updateUser",fieldWidth:"4",type:"text", readonly: false,options:{}}
            ],
            [

		]],
        rowData: row,
        callback: callback
    });
}

//上传弹框
function uploadFile(){
    HAF.Form.sampleUpload({
        title:"缩略图上传",
        allowTypes: ["jpg","png","gif","bmp","jpeg"],
//        url: "${path}/upload/photo/upload.do", 可自定义
        maxSize: 200,
        success: function(data){
            if(data){
                alert("缩略图上传成功！");
//                alert(HAF.stringify(data)); 打印传来的值
                $("#thumbnail").val(data[0].id);
                $("#thumbnailPre").attr("src").val(HAF.basePath+"/oa/service/attach/download.do?id="+data[0].id);
            }
        },
        error:function(data){
            alert("上传失败！");
        }
    });
}

//初始化input显示tree的弹框
HAF.Form.inputGroup("#parentCategoryTitle",{
        handle:function(){
            HAF.dialog({
                key:"cms-category",
                title:"选择父栏目",
                width:"650px",
                height:"450px",
                content: "<div id='category-tree'></div>",
                ready:function($dialog){
					//加载tree
                    showCategoryTree();
                },
                success:function($dialog){
                    /*if($dialog.find("[name='fiDocNumber']").val()!=""){
                        alert("凭证已经创建，本次不重复执行");
                        return true;
                    }*/
					//赋值
                    $("#parentCategoryId").val($('#category-tree').tree("getSelected").id);
                    $("#parentCategoryTitle").val($('#category-tree').tree("getSelected").text);
                }
            });
        }
    });
	
/**
 * 加载菜单树
 */
function showCategoryTree(){
    //初始化资源树数据
    $("#category-tree").tree({
        url:HAF.basePath()+'/cms/category/getCategoryTree.do',
        method:"GET",
//        checkbox:true,
        cascadeCheck:false,//取消级联选中
        parentField:"pid",//父ID
        textFiled:"text", //显示中文
        idFiled:"id", //tree对应的ID
        lines:true,
        onBeforeExpand: function(node){
            if(node){
                $('#category-tree').tree('options').url = HAF.basePath()+"/cms/category/getCategoryTree.do";
            }
        },
        onLoadSuccess:function(node,data){
            var t = $(this);
            if(data){
				//展开所有tree
                $(data).each(function(index,d){
                    if(this.state == 'closed'){
                        t.tree('expandAll');
                    }
                });
            }
        },
        onSelect : function(node){
			//单选一个
            var cknodes = $(this).tree("getChecked");
            for(var i = 0 ; i < cknodes.length ; i++){
                $(this).tree("uncheck", cknodes[i].target);
            }
            //再选中改节点
            $(this).tree("check", node.target);
        },
        onDblClick: function(node){
            $('#category-tree').tree('toggle',node.target);
        }
    });
}


//保存广告位管理信息
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
                alert("操作失败，未保存成功");
            }
        }
    });
}

//删除广告位管理信息
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