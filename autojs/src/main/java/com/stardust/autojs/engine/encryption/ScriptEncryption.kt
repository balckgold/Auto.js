package com.stardust.autojs.engine.encryption

import com.stardust.util.AdvancedEncryptionStandard

object ScriptEncryption {

    private var mKey = "1234"
    private var mInitVector = "12345"

    fun decrypt(bytes: ByteArray, start: Int = 0, end: Int = bytes.size): ByteArray {
        return AdvancedEncryptionStandard(mKey.toByteArray(), mInitVector).decrypt(bytes, start, end)
    }

}