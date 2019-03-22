auto.waitFor()
//var intent = new Intent();
//intent.setAction("android.settings.ACCESSIBILITY_SETTINGS"); //打开无障碍设置界面
//app.startActivity(intent);
sleep(15000);
auto.waitFor()
log("已经开启")

//全局状态机业务
var interval=5000;

var rootFlag=false;
rootFlag=hasRoot();
if(rootFlag)
	var rootAuto = new RootAutomator();

//*************************项目相关*************************//
device.sdkInt;
//坐标点击包装
function clickWrapper(x,y){
	 if(!rootFlag&&!device.sdkInt<24){
	 	log("没有root权限也不是android 7以上设备，无法使用click坐标功能");
	 	exit();
	 }
	//这里需要定制下，不同项目不一样
	if(rootFlag)
		rootInputTap(x,y)
	else{
		click(x,y);
	}
	sleep(400);
}

//坐标滑动，支持上滑或下滑
//x:开始X Y:开始Y  s：滑动屏幕的多少分之一（3就是三分之一）,down:滑动方向，默认页面下滑（手指上滑）
function rawScrollDown(x,y,s,down,slow){
	if(x==0||y==0||s==0){
		log("X,Y,S不可以为0");return -1;
	}
	var rawX=device.height*x;
	var rawY=device.height*y;
	if(slow)
		scrollTime=500;
	else
		scrollTime=100;
	if(slow)
	if(!rootFlag&&!device.sdkInt<24){
		log("没有root权限也不是android 7以上设备，无法使用滑动坐标功能");
		exit();	
	}	
	if(rootFlag){
		if(down)
				Swipe(rawX,rawY,rawX,rawY-device.height*s,scrollTime);
		else
				Swipe(rawX,rawY,rawX,rawY+device.height*s,scrollTime);
	}else{
		if(down)
			rootAuto.swipe(rawX,rawY,rawX,rawY-device.height*s,scrollTime)
		else
			rootAuto.swipe(rawX,rawY,rawX,rawY+device.height*s,scrollTime)
	}
	return 1;

}

//*************************root*************************//


function hasRoot(){
	var r=shell("ls /system/bin",true).result.toString()
	if(r.length>50){
	  return true
	}else{
	  return false
	}
};

function forceRoot(){
	if(rootFlag)
		return
	else
		log("系统没有root权限");
	exit();
}

function rootInputTap(x,y){
	log("root shell input tap "+ x +" "+ y);
	forceRoot();
	shell("input tap "+ x +" "+ y,true);
}

function rootAutoPressLog(a,b,c){
	log("RootAutomator Press点击：X:"+a.toString()+";Y:"+b.toString());
	forceRoot();
	rootAuto.press(a,b,c);
}
function rootAutoSwipDown(){
	log("RootAutomator 下滑一下");
	forceRoot()
	rootAuto.swipe(device.width/2,(device.height*2)/3,device.width/2,device.height/3);
	sleep(500);
}

function rootShell(a){
	log("rootShell执行："+a);
	forceRoot();
	return shell(a,true);
}



//********************获取通知**********************//

/*
events.observeNotification();
events.onNotification(function(notification){
    log(notification.getText());
    log(notification.getTitle());
    //微信抢红包
    if(notification.getText().search("微信红包")!=-1){
    	notification.click();
    }
});
*/

var lastToastFlag=0;
var mifiNeedLogin=false;
events.observeToast();
events.onToast(function(toast){
	log("Toast内容: " + toast.getText() + " 包名: " + toast.getPackageName());
	if(toast.getPackageName()=="com.juejin"){
		if(toast.getText()=="变机宝：还原存留成功"){
			tmpDate=new Date();
			lastToastFlag=tmpDate.getTime()
			log("一键操作成功at time:"+tmpDate.toString())
		}else if(toast.getText()=="变机宝：已经是最后一个了"){
			log("最后一个变机宝");
			lastToastFlag=-1;
		}else if(toast.getText()=="变机宝：已经是第一个了"){
			log("第一个变机宝");
			lastToastFlag=-2;
		}
	}else if(toast.getText()=="登录已过期，请重新登录后再试"){
		mifiNeedLogin=true;
	}
});



//*************************util*************************//
//在当前线程中持续等待condFunction满足条件，直到超时。此函数会阻塞，但是相对安全的，因为是额外开辟一个线程来做处理，本线程只做判断。
//condFunction 函数返回true就结束运行
//函数返回true表示条件满足，否则超时
function threadBlockWating(tmpTimeout,condFunction){
	var tmpRet=false;
	log("start threadBlockWating with timeout "+tmpTimeout);
	//启动子线程
	var tmpThread=threads.start(function (){
		log("start cond thread");
		var tmpCount=0;
		while(!condFunction()&&tmpCount<tmpTimeout){//正常业务
			sleep(1);
			tmpCount++;
			continue;
		}
		if(tmpCount<tmpTimeout)
			tmpRet=true;
	});
	tmpThread.join(tmpTimeout);
	sleep(30)
	if(tmpThread.isAlive()){
		tmpThread.interrupt()
	}
	log("threadBlockWating over with ret " + tmpRet)
	return tmpRet;
}
//等待tmpTimeout时间如果没有满足condFunction条件，就按back返回，尝试times还不满足就返回函数
//返回true表示满足
function returnWaitCondLess(tmpTimeout,condFunction,times){
	times=times||1;
	var i=0;
	for(i=0;i<times;i++){
		if(!threadBlockWating(tmpTimeout,condFunction)){
			log("按一次返回键")
			back();
		}
		else{
			return true;
		}
	}
	return threadBlockWating(tmpTimeout,condFunction);
}

//查找点击参数中任意一个text属性，采用clickWrapper，坐标点击
function textsClick(texts){
 for(var i in texts){
	 //log("查找并点击："+texts[i])
	 if(text(texts[i]).findOnce()!=null){
		log("找到并点击："+texts[i]);
		clickWrapper(text(texts[i]).findOne().bounds().centerX(),text(texts[i]).findOne().bounds().centerY());
		return true;
	 }
 }
 return false;
}

//循环持续点击texts中出现的任意一个字符。直到tmpTimeout没有出现任意一个。
//完成任意一次点击返回true
function  seriesTextClick(texts,tmpTimeout){
	var tmpRet=false;
	log("start seriesTextClick:"+texts)
	while(true){
		if(threadBlockWating(tmpTimeout,function(){
												 if(textsClick(texts))
													 return true;
												 else
												 	return false;
			
							})
		){
			tmpRet=true;
			continue;
		}else
		break;
	}
	log("seriesTextClick ret:"+tmpRet);
	return tmpRet;
}

//一直等待uiSelects中的任意一个出现，直到tmpTimeout超时
function uiSelectsWait(uiSelects,tmpTimeout){
	return threadBlockWating(tmpTimeout,function(){
										for(var i in uiSelects){
											if(uiSelects[i].findOnce())
												return true;
										}
										return false;
										}
							)	

}



//uiSlecter 直接坐标点击
function uiClickWrapper(X){
	var tmpUiSelect;
	tmpUiSelect=X.findOnce();
	if(tmpUiSelect==null){
		log("异常::::"+X+" :为空,再试试");
		if(!uiForceClick(X)){
			log("还是有异常::::")
			return false;
		}else return true;
	}
	clickWrapper(tmpUiSelect.bounds().centerX(),tmpUiSelect.bounds().centerY());
	return true;
}

//在ui更新过快的界面，强行点击，如果3s还没点到，返回错误
function uiForceClick(X){
	var i=0;
	var tmpUiSelect;
	for(i=0;i<300;i++){
		tmpUiSelect=X.findOnce();
		if(tmpUiSelect!=null){
			clickWrapper(tmpUiSelect.bounds().centerX(),tmpUiSelect.bounds().centerY());	
			return true;
		}else
			sleep(10);
	}
	return false;

}
//导出相关调试信息
function dumpMsg(){
	log("导出调试信息：")
	log("TOP ACITIVITY:::: "+shell("dumpsys acitvity top",rootFlag))
	log("导出当前截图到/sdcard/Pictures目录：")
	//images.captureScreen("/sdcard/Pictures/bug.png")
}
//*************************util end*************************//


//*************************parse object*********************************//
function cloneObject(obj){
	return JSON.parse(JSON.stringify(obj));
}

function cloneParseObject(obj){
	var tmpObj=cloneObject(obj);
	delete tmpObj.objectId;
	delete tmpObj.updatedAt;
	delete tmpObj.createdAt;
	return tmpObj;
}
//*************************parse object*********************************//



//*************************storage*************************//
var globalStorage=null;
function getGlobeStorage(){
	if(globalStorage!=null)
		return globalStorage;
	globalStorage=storages.create("globalStorage");
	return globalStorage;
}


//*************************storage end*************************//

//*************************HTTP For Parse*************************//
//
http.put = function(url, options, callback){
        options = options || {};
        options.method = "PUT";
        return http.request(url, options);
}


var HttpHead={
		headers:{ 
    	    'X-Parse-Application-Id': 'wisp', 
    	    'X-Parse-REST-API-Key': 'wisp', 
    	    'X-Parse-Revocable-Session':1, 
    	    'Content-Type':'application/json'
		}
	};
var serviceIp="http://10.10.54.15";
var ParseId='wisp'
var ParseKey='wisp'
var userName="test_user";
var password="test123";
// getGlobeStorage().remove("httpToken");
var sessionToken=getGlobeStorage().get("httpToken",null);
if(!sessionToken) log("已经登陆了，token："+sessionToken)  //这句话无所谓
var inHttpProceesing=false;

//注册http的回调  event
var HTTPemitter=events.emitter(threads.currentThread());
HTTPemitter.on('httpRsponse',function(s){
	toastLog("httpRsponse http通信: " + s);
	inHttpProceesing=false;
});
//返回-2 http访问错误
//-3 表示session过期，-100表示服务器返回错误
//返回-200 表示未知错误
//返回0表示OK
//?????千万不要调用httpRet.body.string
function checkHttpResponse(httpRet,body){
ret=-1
if(httpRet!=null){
	if(httpRet.statusCode!=200){
		ret = -2
		toastLog("http请求错误");
		return ret;
	}
	if(body.hasOwnProperty('code')){
			if(body.code==209){
				log("token 有问题,error内容：");
				ret=-3;
			}
			else if(body.hasOwnProperty('error')){
				log("返回了error，error内容：");
				ret=-100
			}else{ 
				ret=-200;
			}
			log(body.error.toString());
	}else
	 ret=0;
}else
	ret=0;
return ret;
}



function login(force){

	force = force || false;
	if(force||sessionToken==null&&inHttpProceesing==false){
		threads.start(function (){
			log("开始登陆");
			var loginUrl=serviceIp+"/parse/login?username="+userName+"&password="+password;
			inHttpProceesing=true;
			var httpRet=http.get(loginUrl,HttpHead);
			HTTPemitter.emit('httpRsponse',"登陆完成");
			var httpRetJson=httpRet.body.json();
			if(checkHttpResponse(httpRet,httpRetJson)<0){
				log("登陆错误")
				threads.currentThread().interrupt(); 
			}
			log("login ret body is"+JSON.stringify(httpRetJson)+" statusCode is "+httpRet.statusCode)

			if(httpRetJson.sessionToken!=null){
				sessionToken=httpRetJson.sessionToken.toString();				
				getGlobeStorage().put("httpToken",sessionToken.toString());
				log("get token is "+sessionToken.toString());
			}
			else{
				log("找不到sessionToken");
			}
			threads.currentThread().interrupt(); 
		})
		return 0;
		
    }else if(sessionToken!=null){
    	log("进入fetchJobs状态")
    	//添加session到head中
    	HttpHead.headers['X-Parse-Session-Token']=sessionToken;
    	statFunction=fetchJobs;
    	return 1;
    }
}


var undoJobs=null
// ifPushAll是否推送所有字段，为否只更新必要的字段
function pushOneJob(job,ifPushAll){
	ifPushAll = ifPushAll || false;
	if(job !=null && job.objectId!=null &&inHttpProceesing==false){
	
		var targetUrl=serviceIp+"/parse/classes/task/"+job.objectId.toString();
		
		threads.start(function (){
		log("pushOnejob "+targetUrl+"body is "+JSON.stringify({'done':job.done}))
		var tmpOptions={
			body:JSON.stringify(cloneParseObject(job)),
			headers:HttpHead.headers	 
		}
		
		inHttpProceesing=true;
		var httpRet=http.put(targetUrl,tmpOptions);
		HTTPemitter.emit('httpRsponse',"updateOneJob完成");
		log("http ret is "+httpRet.body.string());
		})
	}
}

//返回0表示执行没有完成，返回-1表示获取的数据有误，返回1表示执行完成获取成功。
//注意此方法是不阻塞异步执行返回的，且线程不安全。
var fetchJobsRet=0
function fetchJobs(force){
	force = force || false;
	if((force||undoJobs==null)&&inHttpProceesing==false){
	threads.start(function (){
		log("开始从服务器获取task");
		inHttpProceesing=true;
		var targetUrl=serviceIp+"/parse/classes/task"
		var httpRet=http.get(targetUrl,HttpHead);
		HTTPemitter.emit('httpRsponse',"fetchJob完成");
		var httpRetJson=httpRet.body.json();
		if(checkHttpResponse(httpRet,httpRetJson)<0){
			log("获取task错误")
			threads.currentThread().interrupt(); 
		}
		// log("task is"+JSON.stringify(httpRetJson.results[0].objectId)+" statusCode is "+httpRet.statusCode)
		log("fetchJobs:"+JSON.stringify(httpRetJson.results)+" statusCode is "+httpRet.statusCode)
		undoJobs=httpRetJson.results;
		// undoJobs[0].done=true;
		// pushOneJob(undoJobs[0]);
		// inDebug()
		if(undoJobs==null||undoJobs.length==0){
			if(undoJobs==null) toastLog("获取任务失败：results=null");
			else toastLog("获取任务失败：results长度为0");
			fetchJobsRet=-1;
		}else fetchJobsRet=1;
	})
	}
	if(fetchJobsRet!=0){
		var tmpRet=Number(fetchJobsRet);
		fetchJobsRet=0;
		return tmpRet;
	}

	return fetchJobsRet;
	
}





////*************************HTTP END*************************//


//***************************微信红包*********************************//
//
//********************************************************************//
var redBagWroking=false
function findRedBag(){
	if(!redBagWroking){
		threads.start(function (){
			redBagWroking=true;
			while(true){
				log("开始找红包");
				text("微信红包").className("android.widget.TextView").waitFor();
				
				var haf_foundBag=0;

				var badBags=[];
				badBags.push(text("已领取").className("android.widget.TextView").find());
				badBags.push(text("已过期").className("android.widget.TextView").find());
				badBags.push(text("已被领完").className("android.widget.TextView").find());

				// badBags.forEach(function(ele){
				// 	ele.forEach(function(ele2){

				// 		log("bad bags :"+ele2.text())
				// 	})
					
				// }

				// )

				var targetsRedBag=null;
				allBag=text("微信红包").className("android.widget.TextView").find();
				var contain;
				log("allBag size is:"+allBag.size());
				allBag.forEach(function(ele1){
				 	contain=false;
				 	log("ele1 React:"+ele1.bounds());
					badBags.forEach(function(ele2){
						log("ele2"); 
						ele2.forEach(function(ele3){
							log("ele3 React:"+ele3.bounds());
							// log("bad bags :"+ele3.text())
							 if(ele1!=null&&ele1.parent()!=null&&ele1.parent().parent()!=null&&ele3!=null){

								log("ele1.parent().bounds().top:"+ele1.parent().bounds().top+"ele3.bounds().top:"+ele3.bounds().top);
								log("ele1.parent().bounds().bottom:"+ele1.parent().bounds().bottom+"ele3.bounds().bottom:"+ele3.bounds().bottom)
								if(ele1.parent().parent().bounds().top<=ele3.bounds().top&&ele1.parent().parent().bounds().bottom>=ele3.bounds().bottom ){
									contain=true;
									log("bad bag :"+ele3.text())
								}
							}
						})
					}
					);

					if(contain==false){
						targetsRedBag=ele1;
						log("find taget bag :"+ele1);

					}else{
						log("grep bag :"+ele1.text())
					}
				});
				if(targetsRedBag==null)
					continue;
				// if(text("微信红包").findOne().parent().findByText("已领取").size()!=0&&text("微信红包").findOne().parent().findByText("已被领完").size()!=0)
				// 	   continue;
				// threadBlockWating(5000,function (){
				// 	tmpTargetsRedBag=text("红包已领取").className("android.widget.TextView").find();
				// 	if(tmpTargetsRedBag!=null&&!tmpTargetsRedBag.empty())
				// 		return 1;
				// 	else
				// 		return 0;

				// });
				log("找到了");
				// var targetsRedBag=text("微信红包").className("android.widget.TextView").find();
				// if(targetsRedBag==null)
				// 	continue;
				// var lastRedBagY=0;
				// var lastRedBag=null;
				// targetsRedBag.each(function(regBag){
				// 	if(lastRedBagY<=regBag.bounds().centerY()){
				// 		lastRedBagY=regBag.bounds().centerY();
				// 		lastRedBag=regBag;
				// 	}
				// })
				
				if(targetsRedBag!=null){
					log("开始点击"+targetsRedBag);
					click(targetsRedBag.bounds().centerX(),targetsRedBag.bounds().centerY());
				}
				else
					continue;

				log("等待button");
				var waitCounter=0;
				while(1){
					sleep(50)
					if(waitCounter>20)
						break;
					waitCounter++;
					if(currentActivity()=="com.tencent.mm.plugin.luckymoney.ui.LuckyMoneyDetailUI"){
						log("红包不对！")
						text("红包记录").waitFor();			
						back();
						break;
					}
					else if(currentActivity()=="com.tencent.mm.plugin.luckymoney.ui.LuckyMoneyNotHookReceiveUI"){
						className("android.widget.Button").waitFor();

						log("开始点击button");
						className("android.widget.Button").findOne().click();
						text("红包记录").waitFor();
						back();
						log("返回");
						break;
					}
				}


				waitForActivity("com.tencent.mm.ui.LauncherUI");
				sleep(100)
				
		}
	})

	}
	else
		return 0;

}

//***************************MIFI*********************************//
//
//********************************************************************//
var mifiRun=false;
var tmpContext=context;

function doMifiAdv(){
    log("进入doMifiAdv")
    if(currentActivity() != "com.tencent.server.fore.QuickLoadActivity" ){
        log("启动mifi manager")
		launch("com.zhiwang.mifimanager");
	}
	if(!threadBlockWating(15000,function(){
											if(currentActivity()=="com.tencent.server.fore.QuickLoadActivity")
												 return  true;
											else if(currentActivity()=="com.tencent.server.fore.TranslucentActivity")
												 return true;
											else if(currentActivity()=="com.tencent.server.fore.DeskTopActivity")
												return  true;
											else 
												return false;
										})){

		log("无法进入mifi主界面");
		textsClick(["确定","返回","打开","关闭"]);
		back();sleep(1000);back();sleep(1000);home();
		dumpMsg();
		return -1;
	}
	
	if(currentActivity()=="com.tencent.server.fore.QuickLoadActivity"){
    	log("进入福利")
		sleep(1500);
		if(!uiClickWrapper(text("福利"))){
			log("进入福利失败");
			back();sleep(1000);back();sleep(1000);home();
			return -1;
		}

		log("尝试点下刷新")
		//uiClickWrapper(text("刷新"))
		rawScrollDown(0.5,0.3,0.3,false,true);
		sleep(2000);


		var qianDao=text("立即签到").findOnce();
		if(qianDao!=null){
			if(uiClickWrapper(text("立即签到"))){
				sleep(3000);
				back();
				return 1;
			}
		}
		var qianDao2=text("重新签到").findOnce();
		if(qianDao2!=null){
			if(uiClickWrapper(text("重新签到"))){
				sleep(3000);
				uiClickWrapper(text("重新签到"))
				back();
				return 1;
			}
		}


		log("等待任务界面");
		if(!uiSelectsWait([text("打开领取"),textContains("去完成")],30000)){
			log("没有要做的任务");
			if(text("已完成").find().size()==3){
				log("所有任务完成");
				return 2;
			}

			return -1;
		}

		log("开始任务");
		if(uiClickWrapper(text("打开领取"))){
			log("领取完成，返回")
			sleep(3000);
			uiClickWrapper(text("允许"))
			sleep(3000)
			rootShell("am force-stop com.miui.packageinstaller");	
			back();sleep(200);back();sleep(300);back();sleep(300);
			home();
			return 1;
		}

		log("点击去完成");
		if(!uiClickWrapper(text("去完成")))
			return -1;
		log("等待进入任务界面")
	}
	var appTaskFlag=null;
	var videoTaskFlag=null;
	while(true){
		log("尝试一次做任务");
		//这里的马上领取，是因为在某些特定情况下会弹出com.tencent.server.fore.DeskTopActivity放广告，进入了视频模式
		if(!uiSelectsWait([text("应用介绍"),text("下一步"),textContains("关闭广告"),text("马上领取"),text["安装"]],30000)){
			log("无法进入任务界面，退出重来");
			back();sleep(500);back();sleep(500);back();sleep(500);
			return -1;		
		}
		appTaskFlag=text("应用介绍").findOnce();
		appInstallingFlag=text("下一步").findOnce();
		videoTaskFlag=textContains("关闭广告").findOnce();


		if(appTaskFlag!=null||appInstallingFlag!=null){
			if(appTaskFlag!=null){
				log("准备安装app");
				while(true){
					log("等待app下载完毕");
					if(uiSelectsWait([text("下一步"),text("安装"),text("打开")],35000)){
						if(text("打开").packageName("com.zhiwang.mifimanager").findOnce()!=null){
							log("一种指定的特殊状态，退出返回");
							back();sleep(1000);
							home();sleep(3000);
							return 1;
						}
							
						break;
					}
					if(currentActivity()!="com.tencent.server.fore.QuickLoadActivity"){
						log("看上去出了异常，跳出了activity");
						return -1;	
					}
				}
			}		
			log("进入应用安装阶段");
			//等待出现下一步
			//一直点下一步，直到安装
			log("一直点击下一步，安装或打开");
			//退出是因为在红米中会不小心点到应用市场安装
			if(seriesTextClick(["下一步","安装","打开","退出"],10000)){
				sleep(5000);home(); 
				sleep(5000);
				return 1;
			}else
				return -1;

		}
		else if(videoTaskFlag!=null||currentActivity()=="com.tencent.server.fore.DeskTopActivity"){
			log("视频任务");
			if(uiSelectsWait([text("马上领取"),text("关闭广告")],20000)){
				log("尝试点击马上领取");
				var successTimes=0;
				while(true){
					if(!uiClickWrapper(text("马上领取"))){
						log("点击马上领取失败，返回");
						// uiClickWrapper(text("关闭广告"));
						back();sleep(500);back();sleep(500);home();sleep(500);
						if(successTimes>0){
							return 1;
						}
						return -1;
					}else{
						log("点击马上领取成功，再试试");
						sleep(3000);
						successTimes++;
						if(successTimes>1){//额外的奖励
							log("可能有额外的任务，乱点一通");
							if(seriesTextClick(["下一步","安装","打开"],10000)){
								back();sleep(500);back();sleep(500);home();sleep(500);
							}
							//一般也就两个马上领取，直接退出算了
							back();sleep(500);back();sleep(500);home();sleep(500);
							// rootShell("am force-stop com.miui.packageinstaller");	
							return 1;
						}
						continue;
					}
				}

			}else{ 
				log("可能异常状态，等待进入任务界面");
				sleep(500);
				continue;
			}
		}
	}
}
function mifi_adv(){

    if(!mifiRun){
		uninstallApps();
        threads.start(function (){
            log("mifi 任务开始")
            mifiRun=true;
            while(true){
							  inDebug();
				var tmpRet=doMifiAdv();
				if(tmpRet==2){
					uninstallApps();
				}else if(tmpRet==-1){
					clearBackApp();
				}
                // inDebug();
            }
        })
        //inDebug();
    }
}






function inDebug(){
	while(true)
		sleep(1000);
}

function doNoting(){
	return 0;
}

//test
function uninstallApps(){
	var whiteApp=["com.tencent.mobileqq","com.zhiwang.mifimanager",
								"org.autojs.autojs","com.tencent.mm","com.virtualdroid.kit",
								"com.topjohnwu.magisk","de.robv.android.xposed.installer","com.juejin",
							"com.gojek.galau.ggtools","com.wisp.mifi"]
	var pm = context.getPackageManager()
	var appList=pm.getInstalledApplications(0)
	var appInfoList=[]
	for(let i=0;i<appList.size();i++){
	  var tmpApp=appList.get(i)
	  var appInfo={
	    appName:tmpApp.loadLabel(pm),
	    packageName:tmpApp.packageName,
	    isSystemApp:tmpApp.flags&1,
	    firstInstallTime:pm.getPackageInfo(tmpApp.packageName,0).firstInstallTime
	  }
	  appInfoList.push(appInfo)
	}
	appInfoList.sort((a,b)=>{
	  return b.firstInstallTime-a.firstInstallTime
	})
	var nowTime = new Date().getTime()
	log("当前时间是"+nowTime)

	for(var tmpApp in appInfoList){
		if(!appInfoList[tmpApp].isSystemApp){
			log("app "+appInfoList[tmpApp].appName +"不是系统app");
			if(whiteApp.indexOf(appInfoList[tmpApp].packageName)!=-1 )
				log("app "+appInfoList[tmpApp].appName + "在白名单中")
			else{
				log("卸载app："+appInfoList[tmpApp].appName);
				rootShell("pm uninstall "+appInfoList[tmpApp].packageName);
			}
		}
	}
}

//清理后台程序
function  clearBackApp(){
	var whiteApp=["com.tencent.mobileqq","com.zhiwang.mifimanager","org.autojs.autojs","com.tencent.mm","com.wisp.mifi"]
	var pm = context.getPackageManager()
	var appList=pm.getInstalledApplications(0)
	var appInfoList=[]
	for(let i=0;i<appList.size();i++){
	  var tmpApp=appList.get(i)
	  var appInfo={
	    appName:tmpApp.loadLabel(pm),
	    packageName:tmpApp.packageName,
	    isSystemApp:tmpApp.flags&1,
	    firstInstallTime:pm.getPackageInfo(tmpApp.packageName,0).firstInstallTime
	  }
	  //只收集第三方
	  if(!appInfo.isSystemApp)
	  	appInfoList.push(appInfo)
	}

	for(var tmpApp in appInfoList){
		if(whiteApp.indexOf(appInfoList[tmpApp].packageName)!=-1 )
			log("app "+appInfoList[tmpApp].appName + "在白名单中")
		else{
			var shellRet=rootShell("ps |grep "+appInfoList[tmpApp].packageName);
			log("shellRet为"+shellRet.result);
			if(shellRet.code == 0){ //shell执行成功
				if(shellRet.result.length>4)
					log("杀死 app："+appInfoList[tmpApp].appName);
					rootShell("am force-stop " +  appInfoList[tmpApp].packageName);	
					sleep(3000);
			}
		}
	
	}

}

function doBjb(){
	shell("am start " + app.intentToShell({
    packageName: "com.juejin",
		className: "com.juejin.ui.MainShowActivity"
}), true);
	if(!threadBlockWating(10000,function (){
		if(currentActivity()=="com.juejin.ui.MainShowActivity")
			return true;
		else   return false;		
	})){
		log("启动变机宝失败，尝试乱点一通，并杀死变机宝后返回");
		seriesTextClick(["允许","启动"],1000);
		back();sleep(500);back();sleep(500);home();
		rootShell("am force-stop com.juejin");	
		sleep(3000);
		return -1;
	}

	log("进入变机宝")
	if(!uiSelectsWait([id("button7_main")],5000)){
		return -2;
	}
	log("进入存留");
	if(!uiClickWrapper(id("button7_main")))
		return -2;
	var bjb_dir=getGlobeStorage().get("bjb_dir","forward");
	log("开始切换记录");
	if(bjb_dir=="forward"){
		uiClickWrapper(id("hardfrushbutton"));
	}else
		uiClickWrapper(id("hardsavebutton"));

	
	while(true){
		log("等待切换成功");
		sleep(1000);
		if(lastToastFlag<0){
			if(lastToastFlag==-1)
			getGlobeStorage().put("bjb_dir","back");
			else if(lastToastFlag==-2)
			getGlobeStorage().put("bjb_dir","forward");
			lastToastFlag=0;//这里需要切到0，否则有bug
			log("最后一个或第一个，重新处理")
			return -3;
		}		
		
		tmpDate=new Date().getTime();
		log("当前时间"+tmpDate.toString())
		if(tmpDate>lastToastFlag&&tmpDate-lastToastFlag<3000){
			log("切换成功");
			break;
		}
		else{
			continue;
		}
		
	}
	
	uiClickWrapper(id("delselect"));
	sleep(2000);
	if(id("rate").findOnce()!=null){
		log(id("rate").findOne().text());
		if(id("rate").findOne().text().indexOf("当前进度  0")>=0){
			log("第0个，返回不做处理的标识");
			return -3;
		} 
	} 
	// sleep(10000);
	// inDebug();
	return 1;

}

function bjb_do_mifiAdv(){
	var taskFlag=0;
	while(true){
		var tmpRet=doMifiAdv();
		log("此次mifi任务结果为"+tmpRet.toString());		
		if(tmpRet==2){		
			break;
		}
		if(tmpRet<0){
			if(tmpRet==-1){
				rootShell("am force-stop com.zhiwang.mifimanager" );
				clearBackApp();
				
			}
			taskFlag++;
		}else{
			taskFlag=0;
		}
		if(taskFlag>5){
			log("此次mifi任务失败五次，放弃")
			break;
		}
		if(mifiNeedLogin){
			log("mifi需要重新登录")
			//code me
			waitForActivity("com.tencent.server.fore.QuickLoadActivity");
			mifiNeedLogin=false;
		}
		log("此时taskFlag为"+taskFlag);
	}
	uninstallApps();
	return 1;
}

var bjbWroking=false
function bjb(){
	if(bjbWroking)
		return 0;
	bjbWroking=true;
	threads.start(function (){
		
		if(getGlobeStorage().get("bjb_dir","forward")=="forward")
			log("变机宝将使用存留方向为：下一条记录")
		else
			log("变机宝将使用存留方向为：上一条记录")
		log("bjb 任务开始,5s后先做一次初始任务")
		sleep(5000);
		bjb_do_mifiAdv();
		log("初始任务做完，休眠60s")
		sleep(6000);
		while(true){
			log("bjb 任务")
			if(doBjb()==1){
				//启动实际任务，授权app
				log("启动业务");
				launch("com.zhiwang.mifimanager");
				waitForActivity("com.android.packageinstaller.permission.ui.GrantPermissionsActivity",10000)
				seriesTextClick(["立即开启","允许"],3000);
				
				bjb_do_mifiAdv();
			}
			sleep(5000);
		}
	})
	return 0;
}
/*
if(nowTime-appInfoList[0].firstInstallTime>86400000){
	log("卸载"+appInfoList[0].packageName);
	rootShell("pm uninstall "+appInfoList[0].packageName);
}
*/
//clearBackApp()
//inDebug()
//test end


// log("初始化状态机，进入login")
// statFunction=login;
// statFunction=mifi_adv;
statFunction=bjb;
roopStat();

//inDebug()
function roopStat(){
    statFunction()  
    setTimeout(roopStat, interval);
}




