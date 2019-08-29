package com.stardust.autojs.engine.preprocess;

import android.util.Log;



import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;

import android.util.Base64;
import android.content.Context;

import com.stardust.pio.PFiles;
import com.stardust.util.AdvancedEncryptionStandard;


import cn.leancloud.AVLogger;
import cn.leancloud.AVOSCloud;
import cn.leancloud.AVObject;
import cn.leancloud.AVQuery;
import cn.leancloud.AVUser;
import io.reactivex.Observable;
import io.reactivex.Observer;
import io.reactivex.disposables.Disposable;

import static java.lang.Thread.sleep;


public class WispPreprocessor extends AbstractProcessor {
    private StringBuilder mNewScript;
    private String mKey = "e7c2e459ba3069ce2c9f312345678c07";
    private String mInitVector = "0e491e6efc605dc3";
    private String mKey2;
    private String mInitVector2;
    //crypt 为true加密，为flase解密
    private boolean mCrypt;
    @Override
    protected void handleChar(int ch) {
        mNewScript.append((char) ch);
    }
    @Override
    public void reset() {
            mNewScript = new StringBuilder();
//        Log.d("wisp","start reset");
//        AVOSCloud.setLogLevel(AVLogger.Level.DEBUG);// or AVOSCloud.setLogLevel(AVLogger.Level.VERBOSE);
        AVUser currentUser = AVUser.getCurrentUser();
        if(currentUser==null){
//            Log.d("wisp","currentUser is null");
            AVUser.logIn("normal_user", "normalUser123!@#").subscribe(new Observer<AVUser>() {
                public void onSubscribe(Disposable disposable) {
//                    Log.d("wisp","onSubscribe " + disposable.toString());
                }
                @Override
                public void onNext(AVUser avUser) {
                    AVUser getUser = AVUser.getCurrentUser();
//                    Log.d("wisp","login user is :"+getUser.getUsername());
                }
                @Override
                public void onError(Throwable e) {

                }
                @Override
                public void onComplete() {
//                    Log.d("wisp","OK");
                    ;
                }
        });
        }else{
//            Log.d("wisp","currentUser is :"+currentUser.getUsername());
            ;
        }
        while(AVUser.getCurrentUser()==null){
            try {
                sleep(50);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        String objectId = "5ca1a67242cda61644af79d7";
        AVQuery<AVObject> avQuery = new AVQuery<>("keys");
        AVObject tmpObject = avQuery.get(objectId);

        mKey= (String) tmpObject.get("key");
        mInitVector=(String)tmpObject.get("Vector");

        String objectId2 = "5cad8ebda91c932819d64963";
        AVQuery<AVObject> avQuery2 = new AVQuery<>("keys");
        AVObject tmpObject2 = avQuery2.get(objectId2);

        mKey2= (String) tmpObject2.get("key");
        mInitVector2=(String)tmpObject2.get("Vector");

//        Log.d("wisp","mKey is :"+mKey);
//        Log.d("wisp","mInitVector is :"+mInitVector);
//        Log.d("wisp","reset WispPreprocessor");
    }
    //config 为true加密，为flase解密
    public WispPreprocessor(){
        ;
    }

    @Override
    public Reader getReaderAndClear() {
//        Log.d("wisp","after process,the mNewScript is :"+mNewScript.toString());
        Reader reader = null;
        String tmpScript=mNewScript.toString();
        if(tmpScript.startsWith("wisp1")){//解密
            try {
                String tarScript=tmpScript.substring(5);
                byte[] oldBytes = Base64.decode(tarScript.getBytes(), Base64.DEFAULT);
                String tmpNewScript = new String(new AdvancedEncryptionStandard(mKey.getBytes(), mInitVector).decrypt(oldBytes, 0, oldBytes.length));
//                Log.d("wisp", "after decrypt:" + tmpNewScript);
                reader = new StringReader(tmpNewScript);
            } catch (IOException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }else if(tmpScript.startsWith("wisp7@#%%%")){//加密
            try {
                String tarScript=tmpScript.substring(10);
//                Log.d("wisp", "target code:" +tarScript);
                byte[] tmpBytes = new AdvancedEncryptionStandard(mKey.getBytes("utf-8"), mInitVector).encrypt(tarScript.getBytes());
                String stringBase=Base64.encodeToString(tmpBytes,Base64.DEFAULT);
                PFiles.write("/sdcard/wisp.js",stringBase);
//                Log.d("wisp", "encrypt end:" );
                reader = new StringReader(tarScript);
            } catch (IOException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }else if(tmpScript.startsWith("wisp8@#%%%")){//加密
            try {
                String tarScript=tmpScript.substring(10);
//                Log.d("wisp", "target code:" +tarScript);
                byte[] tmpBytes = new AdvancedEncryptionStandard(mKey2.getBytes("utf-8"), mInitVector2).encrypt(tarScript.getBytes());
                String stringBase=Base64.encodeToString(tmpBytes,Base64.DEFAULT);
                PFiles.write("/sdcard/wisp.js",stringBase);
//                Log.d("wisp", "encrypt end:" );
                reader = new StringReader(tarScript);
            } catch (IOException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }else if(tmpScript.startsWith("wisp2")){//解密
            try {
                String tarScript=tmpScript.substring(5);
                byte[] oldBytes = Base64.decode(tarScript.getBytes(), Base64.DEFAULT);
                String tmpNewScript = new String(new AdvancedEncryptionStandard(mKey2.getBytes(), mInitVector2).decrypt(oldBytes, 0, oldBytes.length));
//                Log.d("wisp", "after decrypt:" + tmpNewScript);
                reader = new StringReader(tmpNewScript);
            } catch (IOException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        else{
            reader = new StringReader(mNewScript.toString());
        }
        mNewScript = null;

        return reader;
    }

}
