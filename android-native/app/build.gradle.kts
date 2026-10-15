import java.util.Properties
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.lvjie.nativeapp"
    compileSdk = 35
    buildToolsVersion = "35.0.0"

    defaultConfig {
        applicationId = "com.lvjie.nativeapp"
        minSdk = 26
        targetSdk = 35
        versionCode = 14
        versionName = "1.7.0"
    }

    // 密码只从 local.properties / 环境变量读取，不入库。
    // 缺 keystore 或密码为空时不创建 release 签名，避免配置阶段因 storeFile 不存在而失败。
    val signingProps = Properties()
    val localProps = rootProject.file("local.properties")
    if (localProps.exists()) localProps.inputStream().use { signingProps.load(it) }
    fun signingProp(key: String, env: String): String =
        (System.getenv(env) ?: signingProps.getProperty(key) ?: "").trim()
    val releaseStoreFile = file(signingProp("storeFile", "LVJIE_STORE_FILE").ifEmpty {
        rootProject.file("release.keystore").absolutePath
    })
    val releaseStorePassword = signingProp("storePassword", "LVJIE_STORE_PASSWORD")
    val releaseKeyAlias = signingProp("keyAlias", "LVJIE_KEY_ALIAS").ifEmpty { "lvjie" }
    val releaseKeyPassword = signingProp("keyPassword", "LVJIE_KEY_PASSWORD").ifEmpty { releaseStorePassword }
    val releaseSigningReady = releaseStoreFile.exists() && releaseStorePassword.isNotEmpty()

    signingConfigs {
        if (releaseSigningReady) {
            create("release") {
                storeFile = releaseStoreFile
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            if (releaseSigningReady) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            // 不用发行签名。无 keystore 时使用 AGP 默认 debug 密钥。
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.foundation:foundation")

    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
}
