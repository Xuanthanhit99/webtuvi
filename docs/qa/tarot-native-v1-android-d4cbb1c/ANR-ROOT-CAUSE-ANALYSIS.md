# Android ANR Root Cause Analysis - Menh Vi Tarot Native V1

**Conclusion: INCONCLUSIVE.** The immediate blocking mechanism is established,
but the originating fault cannot be attributed conclusively to Expo Go, Android
emulator/platform, React Native, or Menh Vi application code from this capture.

Date: 2026-10-14; timestamps below are device +07:00 (Asia/Bangkok).
Baseline: d4cbb1c, feat/mobile-v1-full-parity.

## 1. Integrity and provenance

ZIP: `bugreport-sdk_gphone64_x86_64-AE3A.240806.036-2026-10-14-15-20-44.zip`
SHA-256: `5f4cc9406558c2b21bca8faa5de0eb2c5a8db31ce400d2cd3ac9965cab2da0b5`
Size: 6,837,635 bytes; 238 ZIP members. Full decompression/CRC check passed
(`ZipFile.testzip() == None`). This establishes internal integrity, not independent
chain-of-custody authenticity. Original ZIP and other QA evidence were not changed.

ANR/trace entries:

| ZIP member | Bytes | Identity |
|---|---:|---|
| FS/data/anr/anr_2026-10-14-15-03-00-002 | 440278 | Target Expo Go PID 15924 plus system_server and keyboard supporting dumps |
| FS/data/anr/anr_2026-10-14-09-28-29-416 | 28451 | Older Google Maps PID 8901 startup failure; not the target event |
| FS/data/anr/trace_00 | 113422 | Keyboard com.google.android.inputmethod.latin PID 9418, 15:03:09.769 +07:00; not Expo Go main stack |

Main bugreport text: `bugreport-sdk_gphone64_x86_64-AE3A.240806.036-2026-10-14-15-20-44.txt`.
Line numbers in this report refer to UTF-8 decoded ZIP member contents, not the
compressed archive. Selected numbered excerpts are embedded below for inspection
without extracting or altering the original members.

## 2. Exact event and timeline

- Target window: 443b8a3, host.exp.exponent/.experience.ExperienceActivity.
- Process PID 15924; main Linux TID 15924; ART tid 1.
- InputDispatcher detects unresponsiveness at 15:02:59.700; am_anr records it at
  15:02:59.861; thread dump header is 15:02:59.944642700+0700.
- Reason: FocusEvent(hasFocus=true) was not acknowledged for 5007 ms.
- This is an input-dispatch timeout with an identified window, not a
  no-focused-window ANR and not a Java exception/crash.

| Time (+07:00) | Evidence | Interpretation |
|---|---|---|
| 14:54:38.141 | Main report L48495 | ReactNativeJS Running main; initial app render occurred well before target ANR |
| No wall-clock stamp | expo-lan-attempt.log L25: Android Bundled 230959ms / 2143 modules | Host bundling duration; cannot equate this with Android UI-thread blocking |
| 15:02:26.539 | Main report L122556 | Expo process frozen while backgrounded |
| 15:02:38.280 | Main report L70768 | Shell deep link starts Expo LauncherActivity |
| 15:02:48.506 / .521 | Main report L122575-122576 | ANON compaction then unfreeze; resource/lifecycle context, not proof of faulty freeze logic |
| 15:02:52.221 to 15:02:53.036 | Main report L122602-122605 | ExperienceActivity restart/start/resume/top-resumed |
| 15:02:53.484 | Main report L71351-71360 | Cannot connect to Expo CLI at 172.23.9.20:8082; warning, not UI-thread network stack |
| 15:02:54.581 | Main report L122611 | Window becomes focusable and gains focus |
| 15:02:54.134/.162 and 15:02:59.513/.514 | Main report L71362-71363, L71818-71819 | SurfaceSyncGroup transaction-ready timeouts (1000 ms) |
| 15:02:58.579 | Main report L71817 | HWUI frame duration 6238 ms; severe frame delay immediately before detection |
| 15:02:59.700/.861/.944 | Main report L71820, L122618; target trace L21 | Detection, event record and near-event stack snapshot |
| 15:03:24.125 | Main report L72523 | ANR diagnostic collection completed in 24391 ms; not the original input timeout duration |

The original android-last-anr.txt L2-3 and screenshot 15 agree with this identity.
The APK-install stack in expo-android-first-attempt.log L13-31 is a separate host
Node/ADB failure. Neither that stack nor NO_COLOR/update notices explain this ANR.

## 3. Main/UI thread: blocking mechanism established

Target trace L29-60 shows the main thread sleeping in a native condition wait:

```
ViewRootImpl.performDraw
  -> HardwareRenderer.setStopped / nSetStopped
  -> HWUI RenderProxy::setStopped
  -> std::future<void>::get
  -> condition_variable::wait / pthread_cond_wait / futex
```

This is a synchronous HWUI render-thread completion wait during a ViewRoot traversal.
There are no Tarot, Hermes, network-read, or synchronous Binder call frames on the
main stack. The kernel waiting-channel sample at 15:02:59.857 (trace L1722-1725),
before SIGQUIT at 15:02:59.944, already shows main in futex_wait_queue. Thus main's
wait is not inferred solely from a suspension caused by the later stack dump.
The trace still does not measure exactly how long this particular future was pending.

## 4. RenderThread, Binder, locks and other threads

- RenderThread: ART tid 41 / Linux TID 15988, trace L863-882. It is sampled in
  ART ConditionVariable::WaitHoldingLocks during JNI CallVoidMethodV, entered from
  HWUI FrameCommitWrapper::onFrameCommit -> CanvasContext::draw -> DrawFrameTask.
  This is a Java callback transition on the native rendering path, not a trace
  of a GPU-driver fence wait. A GPU hang is not established.
- Important limitation: Signal Catcher is performing RunCheckpoint/DumpForSigQuit
  (L256-273); sampled threads have suspension counts. RenderThread's ART wait can
  be influenced by the dump/checkpoint itself. It does not identify the original
  lock owner or prove that this JNI wait existed throughout the 5007 ms timeout.
- Binder callback: binder:15924_9 / Linux TID 17339 (L405-427) is similarly sampled
  in ART JNI NewObjectV from TransactionCompletedListenerWrapper and libgui
  onTransactionCompleted. It connects the evidence to surface transaction callback
  handling, but does not prove a Binder deadlock or a Binder call from main.
- Other attached Binder pool threads are predominantly sleeping in ioctl /
  IPCThreadState::joinThreadPool. The un-attached thread labelled binder:15924_4
  (Linux TID 16054, L1435-1445) waits in libgui AsyncWorker::run; the name alone is
  not evidence of an outstanding synchronous Binder transaction.
- Main, RenderThread and callback list no held ART mutexes. This is not a complete
  native-lock inventory. No named app monitor, ownership chain or wait cycle is
  proven. Do not label the event an application deadlock.
- Binder transaction diagnostics were unavailable: main report L71826 reports
  failure to obtain Binder state; L122617 records a SELinux denial for transactions.
  Absence of a transaction graph limits downstream Binder conclusions.
- RN JS thread mqt_v_js (TID 16668, L558-575) and native queue mqt_v_native (TID
  16669, L884-901) are sleeping in MessageQueue/nativePollOnce at the sample.
  No busy JS loop or Tarot animation execution is evidenced at that instant.
- Glide disk/source workers (L1222-1242 and L1347-1433) are waiting for queued work,
  not decoding a card image in the captured stacks. OkHttp Metro WebSocket readers
  (e.g. L1001-1026) wait on background socket reads; main does not wait on them.
- HeapTaskDaemon is WaitingForTaskProcessor (L303-316). Cumulative GC timing sums
  (L1551 onward) must not be misread as one stop-the-world pause at the ANR instant.

## 5. CPU, scheduling, memory and diagnostic overhead

Main report L72475-72522 reports:

- Load: 5.34 / 4.49 / 2.94.
- CPU PSI some avg10=32.47; memory PSI some/full avg10=12.89/5.96;
  I/O PSI some/full avg10=11.89/4.81. These are reported pressure averages,
  not percentages of app execution or proof of the originating fault.
- CPU accounting window is explicitly AFTER detection: 15:02:59.840-15:03:23.661.
  TOTAL is 54% (3.6% user, 30% kernel, 20% iowait, 0.7% softirq).
- Expo Go: 23% (1.1% user, 21% kernel), 459 major page faults in that window.
  system_server 38%, keyboard 31%, ranchu graphics composer 23%, SurfaceFlinger 18%.
- The shorter 15:03:00.351-15:03:01.363 window includes substantial ANR collection
  work: Signal Catcher is 46%; AnrAuxiliaryTask is 63%. This cannot be attributed
  to application work that caused the earlier timeout.
- Target trace L2-6: RSS 277076 KB; swap 333180 KB. This and the recorded compaction
  support meaningful memory/I/O pressure, not proof of an application memory leak.
- schedstat cumulative run/runqueue nanoseconds: main 81.489s/67.097s;
  RenderThread 52.084s/34.219s; JS 49.482s/33.408s. These are cumulative counters,
  not a scheduling timeline for the five seconds before detection.

System resource pressure and native graphics/lifecycle delays are plausible
contributors. The report lacks a pre-event scheduling trace or host GPU/CPU
telemetry capable of proving that pressure caused this exact rendering wait.

## 6. Tarot scope and category attribution

The observed Tarot screen is guest-only (11-tarot-guest-390.png, 14-expo-target-390.png).
Source at baseline apps/mobile/src/app/(tabs)/tarot.tsx L195 gates authenticated
content; L237 requires a token for the 78-card grid; L282 requires a reading for
flip results. Shuffle and reveal components are not mounted in that captured state.
The Reduced Motion preference hook is still mounted, but has no implicated frame.
This does not prove every possible application operation innocent; it rejects an
unsupported attribution to 78-card rendering or Tarot flip/shuffle in this event.

| Candidate category | Evidence-based assessment |
|---|---|
| Android emulator/platform | Strong candidate: HWUI wait, slow frame, surface transaction delays and system pressure; originating emulator/ART/graphics fault not proven |
| Expo Go infrastructure | Strong contextual candidate: dev-menu overlay and ExperienceActivity re-focus; no Expo-specific blocking frame/lock owner establishes the defect |
| React Native runtime | No root fault established; JS/native queues idle at snapshot; framework may participate upstream, but no causal RN stack shown |
| Menh Vi application | No responsible code path identified; no evidence supporting Tarot animation/image-grid blame |
| Overall classification | **INCONCLUSIVE** for ultimate root cause; native HWUI completion wait on main is established |

## 7. Minimal fix and next gate

No application source patch, package update, animation rewrite, or graphics-setting
change is justified as a confirmed fix by this evidence. A specific fix requires
identifying why HWUI completion was delayed, including the pre-SIGQUIT RenderThread
state and any ART/Binder owner chain. Current findings narrow that investigation
considerably; they do not establish a known version-specific Expo or emulator bug.

For a future separately authorized QA run: isolate emulator foreground ownership,
ensure dev-server connectivity, avoid developer-menu/focus changes during the actual
Tarot interaction, and compare the same baseline in a development client or a real
Android device. These are isolation experiments, not confirmed fixes. If the stall
recurs, an event-aligned scheduling/render trace is needed to separate resource
starvation, ART/checkpoint effects, and graphics lifecycle contention.

No experiment, app start, emulator restart, source change, commit, push, Actions,
merge or deployment was performed in this analysis. Native/Visual/Backend E2E PASS
is not claimed. Only this separate analysis report was created.

Interpretation references (primary sources):

- [Android ANR diagnosis](https://developer.android.com/topic/performance/anrs/diagnose-and-fix-anrs): distinguish app/system issues and use scheduling evidence for causal attribution.
- [AOSP bugreport interpretation](https://source.android.com/docs/core/tests/debug/read-bug-reports): a sampled stack need not be the originating culprit.
- [AOSP RenderProxy implementation](https://android.googlesource.com/platform/frameworks/base/%2B/99e1424/libs/hwui/renderthread/RenderProxy.cpp): setStopped queues synchronous work on the rendering thread; supporting mechanism reference, not a symbol/build-exact match to this device.

## 8. Numbered excerpts from original ZIP members

### FS/data/anr/anr_2026-10-14-15-03-00-002 - subject and main

```text
1: Subject: Input dispatching timed out (443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)).
2: RssHwmKb: 637952
3: RssKb: 277076
4: RssAnonKb: 115552
5: RssShmemKb: 12032
6: VmSwapKb: 333180
21: ----- pid 15924 at 2026-10-14 15:02:59.944642700+0700 -----
22: Cmd line: host.exp.exponent
23: Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.036/12592187:user/release-keys'
24: ABI: 'x86_64'
25: Build type: optimized
26: Debug Store: 1,0,60790269::
27: suspend all histogram:	Sum: 82.593ms 99% C.I. 0.058ms-45.061ms Avg: 3.059ms Max: 50.063ms
28: DALVIK THREADS (76):
29: "main" prio=5 tid=1 Native
30:   | group="main" sCount=1 ucsCount=0 flags=1 obj=0x720c29b8 self=0x75a9a5c6b7b0
31:   | sysTid=15924 nice=-10 cgrp=top-app sched=0/0 handle=0x75ac37619d18
32:   | state=S schedstat=( 81488930013 67096858665 50682 ) utm=577 stm=7571 core=0 HZ=100
33:   | stack=0x7ffcdc156000-0x7ffcdc158000 stackSize=8188KB
34:   | held mutexes=
35:   native: #00 pc 00081f56  /apex/com.android.runtime/lib64/bionic/libc.so (syscall+22) (BuildId: eb58b4d427279994f00c0e1818477e4f)
36:   native: #01 pc 0005f07a  /apex/com.android.runtime/lib64/bionic/libc.so (__futex_wait_ex+154) (BuildId: eb58b4d427279994f00c0e1818477e4f)
37:   native: #02 pc 0006c8a2  /apex/com.android.runtime/lib64/bionic/libc.so (pthread_cond_wait+50) (BuildId: eb58b4d427279994f00c0e1818477e4f)
38:   native: #03 pc 000acf6e  /system/lib64/libc++.so (std::__1::condition_variable::wait+14) (BuildId: 756a4b12135b6afbd218ce56105fca791f3c52be)
39:   native: #04 pc 000ad6da  /system/lib64/libc++.so (std::__1::__assoc_sub_state::copy+74) (BuildId: 756a4b12135b6afbd218ce56105fca791f3c52be)
40:   native: #05 pc 000ad935  /system/lib64/libc++.so (std::__1::future<void>::get+21) (BuildId: 756a4b12135b6afbd218ce56105fca791f3c52be)
41:   native: #06 pc 0025c70d  /system/lib64/libhwui.so (android::uirenderer::renderthread::RenderProxy::setStopped+397) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
42:   at android.graphics.HardwareRenderer.nSetStopped(Native method)
43:   at android.graphics.HardwareRenderer.setStopped(HardwareRenderer.java:527)
44:   at android.view.ViewRootImpl.performDraw(ViewRootImpl.java:5351)
45:   at android.view.ViewRootImpl.performTraversals(ViewRootImpl.java:4303)
46:   at android.view.ViewRootImpl.doTraversal(ViewRootImpl.java:2917)
47:   at android.view.ViewRootImpl$TraversalRunnable.run(ViewRootImpl.java:10324)
48:   at android.view.Choreographer$CallbackRecord.run(Choreographer.java:1406)
49:   at android.view.Choreographer$CallbackRecord.run(Choreographer.java:1415)
50:   at android.view.Choreographer.doCallbacks(Choreographer.java:1015)
51:   at android.view.Choreographer.doFrame(Choreographer.java:945)
52:   at android.view.Choreographer$FrameDisplayEventReceiver.run(Choreographer.java:1389)
53:   at android.os.Handler.handleCallback(Handler.java:959)
54:   at android.os.Handler.dispatchMessage(Handler.java:100)
55:   at android.os.Looper.loopOnce(Looper.java:232)
56:   at android.os.Looper.loop(Looper.java:317)
57:   at android.app.ActivityThread.main(ActivityThread.java:8705)
58:   at java.lang.reflect.Method.invoke(Native method)
59:   at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
60:   at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
1722: ----- Waiting Channels: pid 15924 at 2026-10-14 15:02:59.857921100+0700 -----
1723: Cmd line: host.exp.exponent
1724: 
1725: sysTid=15924     futex_wait_queue
```

### FS/data/anr/anr_2026-10-14-15-03-00-002 - rendering and callback

```text
863: "RenderThread" daemon prio=7 tid=41 Native
864:   | group="main" sCount=1 ucsCount=0 flags=1 obj=0x141a3ea0 self=0x75a9a5cdc780
865:   | sysTid=15988 nice=-10 cgrp=top-app sched=0/0 handle=0x75a8e28178c0
866:   | state=S schedstat=( 52084359988 34218950815 7546 ) utm=66 stm=5141 core=1 HZ=100
867:   | stack=0x75a8e2720000-0x75a8e2722000 stackSize=990KB
868:   | held mutexes=
869:   native: #00 pc 00081f56  /apex/com.android.runtime/lib64/bionic/libc.so (syscall+22) (BuildId: eb58b4d427279994f00c0e1818477e4f)
870:   native: #01 pc 0047fd6b  /apex/com.android.art/lib64/libart.so (art::ConditionVariable::WaitHoldingLocks+107) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
871:   native: #02 pc 006a1b47  /apex/com.android.art/lib64/libart.so (art::JNI<false>::CallVoidMethodV+567) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
872:   native: #03 pc 0020c314  /system/lib64/libhwui.so (_JNIEnv::CallVoidMethod+164) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
873:   native: #04 pc 0020c993  /system/lib64/libhwui.so (android::FrameCommitWrapper::onFrameCommit+115) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
874:   native: #05 pc 002574bd  /system/lib64/libhwui.so (android::uirenderer::renderthread::CanvasContext::draw+2445) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
875:   native: #06 pc 0025a8dc  /system/lib64/libhwui.so (std::__1::__function::__func<android::uirenderer::renderthread::DrawFrameTask::postAndWait::$_0, std::__1::allocator<android::uirenderer::renderthread::DrawFrameTask::postAndWait::$_0>, void >::operator +1548) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
876:   native: #07 pc 0026653e  /system/lib64/libhwui.so (android::uirenderer::WorkQueue::process+686) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
877:   native: #08 pc 002b43db  /system/lib64/libhwui.so (android::uirenderer::renderthread::RenderThread::threadLoop+475) (BuildId: 35d37af4b0a83cc5d3a054e91ea6e9af)
878:   native: #09 pc 00016936  /system/lib64/libutils.so (android::Thread::_threadLoop+166) (BuildId: f128755c26519c61f5cd218576eff285)
879:   native: #10 pc 0006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
880:   native: #11 pc 00060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
881:   (no managed stack frames)
405: "binder:15924_9" prio=5 tid=14 Native
406:   | group="main" sCount=1 ucsCount=0 flags=1 obj=0x15a97020 self=0x75a9a5d27370
407:   | sysTid=17339 nice=0 cgrp=top-app sched=0/0 handle=0x75a96b3708c0
408:   | state=S schedstat=( 19268360 100397441 36 ) utm=0 stm=1 core=2 HZ=100
409:   | stack=0x75a96b279000-0x75a96b27b000 stackSize=990KB
410:   | held mutexes=
411:   native: #00 pc 00081f56  /apex/com.android.runtime/lib64/bionic/libc.so (syscall+22) (BuildId: eb58b4d427279994f00c0e1818477e4f)
412:   native: #01 pc 0047fd6b  /apex/com.android.art/lib64/libart.so (art::ConditionVariable::WaitHoldingLocks+107) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
413:   native: #02 pc 006939cb  /apex/com.android.art/lib64/libart.so (art::JNI<false>::NewObjectV+539) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
414:   native: #03 pc 000e0474  /system/lib64/libandroid_runtime.so (_JNIEnv::NewObject+164) (BuildId: 74e467b22a4c3107eac51948743c9977)
415:   native: #04 pc 00168310  /system/lib64/libandroid_runtime.so (android::TransactionCompletedListenerWrapper::transactionCallbackThunk+112) (BuildId: 74e467b22a4c3107eac51948743c9977)
416:   native: #05 pc 000ab327  /system/lib64/libgui.so (decltype std::__1::__invoke[abi:nn180000]<std::__1::function<void >&, void*&, long, android::sp<android::Fence> const&, std::__1::vector<android::SurfaceControlStats, std::__1::allocator<android::SurfaceControlStats>> const&>+55) (BuildId: f7b12340ee108e614f6063a28a7d8e9b)
417:   native: #06 pc 000cf04c  /system/lib64/libgui.so (android::TransactionCompletedListener::onTransactionCompleted+2476) (BuildId: f7b12340ee108e614f6063a28a7d8e9b)
418:   native: #07 pc 000bf53f  /system/lib64/libgui.so (android::BnTransactionCompletedListener::onTransact+287) (BuildId: f7b12340ee108e614f6063a28a7d8e9b)
419:   native: #08 pc 0005925a  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand+1514) (BuildId: a61bb86177e0986f6533dad5dd4bad94)
420:   native: #09 pc 00057f11  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool+929) (BuildId: a61bb86177e0986f6533dad5dd4bad94)
```

### FS/data/anr/anr_2026-10-14-15-03-00-002 - RN queue

```text
558: "mqt_v_js" prio=5 tid=23 Native
559:   | group="main" sCount=1 ucsCount=0 flags=1 obj=0x1468fef8 self=0x75a9a5d09aa0
560:   | sysTid=16668 nice=-4 cgrp=top-app sched=0/0 handle=0x75a96bb548c0
561:   | state=S schedstat=( 49481836777 33408028566 6509 ) utm=3003 stm=1944 core=3 HZ=100
562:   | stack=0x75a96ba51000-0x75a96ba53000 stackSize=1038KB
563:   | held mutexes=
564:   native: #00 pc 000ce75a  /apex/com.android.runtime/lib64/bionic/libc.so (__epoll_pwait+10) (BuildId: eb58b4d427279994f00c0e1818477e4f)
565:   native: #01 pc 000130c4  /system/lib64/libutils.so (android::Looper::pollOnce+308) (BuildId: f128755c26519c61f5cd218576eff285)
566:   native: #02 pc 001825e3  /system/lib64/libandroid_runtime.so (android::android_os_MessageQueue_nativePollOnce+35) (BuildId: 74e467b22a4c3107eac51948743c9977)
567:   at android.os.MessageQueue.nativePollOnce(Native method)
568:   at android.os.MessageQueue.next(MessageQueue.java:346)
569:   at android.os.Looper.loopOnce(Looper.java:189)
570:   at android.os.Looper.loop(Looper.java:317)
571:   at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0(r8-map-id-a0e864c2a8df9346960d12ec2a235b45e4e77e4dff5034e617abec7a88957abe:15)
572:   at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.a(r8-map-id-a0e864c2a8df9346960d12ec2a235b45e4e77e4dff5034e617abec7a88957abe:1)
573:   at com.facebook.react.bridge.queue.b.run(r8-map-id-a0e864c2a8df9346960d12ec2a235b45e4e77e4dff5034e617abec7a88957abe:3)
574:   at java.lang.Thread.run(Thread.java:1012)
```

### bugreport-sdk_gphone64_x86_64-AE3A.240806.036-2026-10-14-15-20-44.txt - focus, detection, graphics warnings

```text
71351: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: Cannot connect to Expo CLI.
71352: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: 
71353: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: Try the following to fix the issue:
71354: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: - Ensure that Expo dev server is running and available on the same network
71355: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: - Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
71356: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: - If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
71357: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: 
71358: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: URL: 172.23.9.20:8082
71359: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: 
71360: 10-14 15:02:53.484 10210 15924 16668 W ReactNativeJS: Error: undefined
71362: 10-14 15:02:54.134 10210 15924 16020 E SurfaceSyncGroup: Failed to receive transaction ready in 1000ms. Marking SurfaceSyncGroup(wmsSync-VRI[ExperienceActivity]#46) as ready
71363: 10-14 15:02:54.162 10210 15924 16020 E SurfaceSyncGroup: Failed to receive transaction ready in 1000ms. Marking SurfaceSyncGroup(VRI[ExperienceActivity]#47) as ready
71817: 10-14 15:02:58.579 10210 15924 16042 I HWUI    : Davey! duration=6238ms; Flags=1, FrameTimelineVsyncId=19806930, IntendedVsync=60782510539408, Vsync=60783327206042, InputEventId=0, HandleInputStart=60783344659300, AnimationStart=60783344718100, PerformTraversalsStart=60783348120800, DrawStart=60783713064400, FrameDeadline=60782527206074, FrameInterval=60783343735700, FrameStartTime=16666666, SyncQueued=60783777385100, SyncStart=60783778351900, IssueDrawCommandsStart=60783805909900, SwapBuffers=60788300127400, FrameCompleted=60788749755800, DequeueBufferDuration=55600, QueueBufferDuration=2194400, GpuCompleted=60788749491300, SwapBuffersCompleted=60788749755800, DisplayPresentTime=0, CommandSubmissionCompleted=60788300127400, 
71818: 10-14 15:02:59.513 10210 15924 16020 E SurfaceSyncGroup: Failed to receive transaction ready in 1000ms. Marking SurfaceSyncGroup(wmsSync-VRI[ExperienceActivity]#48) as ready
71819: 10-14 15:02:59.514 10210 15924 16020 E SurfaceSyncGroup: Failed to receive transaction ready in 1000ms. Marking SurfaceSyncGroup(VRI[ExperienceActivity]#49) as ready
71820: 10-14 15:02:59.700  1000   674  1129 W InputDispatcher: Window 443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is unresponsive: 443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)
71821: 10-14 15:02:59.701  1000   674  1129 W InputDispatcher: Canceling events for 443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) because it is unresponsive
71822: 10-14 15:02:59.711  1000   674  1129 I WindowManager: ANR in Window{443b8a3 u0 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity}. Reason:Input dispatching timed out (443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)).
122575: 10-14 15:02:48.506  1000   674  1113 I am_compact: [15924,host.exp.exponent,ANON,480164,127092,341040,103940,-294660,-12672,-281988,280796,21962,SOME,0,900,15,222044,-63292]
122576: 10-14 15:02:48.521  1000   674  1113 I am_unfreeze: [15924,host.exp.exponent,7]
122602: 10-14 15:02:52.221 10210 15924 15924 I wm_on_restart_called: [122378464,host.exp.exponent.experience.ExperienceActivity,performRestart,0]
122603: 10-14 15:02:52.272 10210 15924 15924 I wm_on_start_called: [122378464,host.exp.exponent.experience.ExperienceActivity,handleStartActivity,51]
122604: 10-14 15:02:53.035 10210 15924 15924 I wm_on_resume_called: [122378464,host.exp.exponent.experience.ExperienceActivity,RESUME_ACTIVITY,734]
122605: 10-14 15:02:53.036 10210 15924 15924 I wm_on_top_resumed_gained_called: [122378464,host.exp.exponent.experience.ExperienceActivity,topWhenResuming]
122606: 10-14 15:02:53.104  1000   674   734 I input_focus: [Focus request 443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity,reason=UpdateInputWindows]
122607: 10-14 15:02:53.135 10210 15924 15924 I viewroot_draw_event: [VRI[ExperienceActivity],Start draw after previous draw not visible]
122608: 10-14 15:02:54.162 10210 15924 16020 I viewroot_draw_event: [VRI[ExperienceActivity],reportDrawFinished seqId=0]
122609: 10-14 15:02:54.316  1000   674   733 I wm_destroy_activity: [0,59742357,29,host.exp.exponent/.LauncherActivity,finish-imm:transit]
122610: 10-14 15:02:54.317  1000   674   733 I wm_stop_activity: [0,39308742,host.exp.exponent/.experience.HomeActivity]
122611: 10-14 15:02:54.581  1000   674  1129 I input_focus: [Focus entering 443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server),reason=Window became focusable. Previous reason: NOT_VISIBLE]
122612: 10-14 15:02:54.597  1000   674   730 I sysui_multi_action: [319,5074,321,11757,322,16019,325,60768,757,761,758,8,759,2,806,host.exp.exponent,871,host.exp.exponent.experience.ExperienceActivity,904,host.exp.exponent,905,0,1320,4,1321,4]
122613: 10-14 15:02:54.598  1000   674   730 I wm_activity_launch_time: [0,122378464,host.exp.exponent/.experience.ExperienceActivity,16019]
122614: 10-14 15:02:57.533  1000   674  1689 I service_manager_stats: [100,431,58762]
122615: 10-14 15:02:58.508 10210 15924 15924 I viewroot_draw_event: [VRI[ExperienceActivity],Start draw after previous draw not visible]
122616: 10-14 15:02:59.513 10210 15924 16020 I viewroot_draw_event: [VRI[ExperienceActivity],reportDrawFinished seqId=0]
122617: 10-14 15:02:59.797  1000   674   674 I auditd  : type=1400 audit(0.0:822): avc:  denied  { read } for  comm="AnrMainProcessD" name="transactions" dev="binder" ino=1048586 scontext=u:r:system_server:s0 tcontext=u:object_r:binderfs_logs_transactions:s0 tclass=file permissive=0
122618: 10-14 15:02:59.861  1000   674 17361 I am_anr  : [0,15924,host.exp.exponent,686341700,Input dispatching timed out (443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)).]
```

### bugreport-sdk_gphone64_x86_64-AE3A.240806.036-2026-10-14-15-20-44.txt - ANR CPU/pressure accounting

```text
72469: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ANR in host.exp.exponent (host.exp.exponent/.experience.ExperienceActivity)
72470: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: PID: 15924
72471: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: Reason: Input dispatching timed out (443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)).
72472: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: Parent: host.exp.exponent/.experience.ExperienceActivity
72473: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ErrorId: 94870f2d-2f74-46d7-a9bd-4baae2b6a158
72474: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: Frozen: false
72475: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: Load: 5.34 / 4.49 / 2.94
72476: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- Output from /proc/pressure/memory -----
72477: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: some avg10=12.89 avg60=9.42 avg300=5.67 total=341023286
72478: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: full avg10=5.96 avg60=4.64 avg300=3.35 total=161472344
72479: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- End output from /proc/pressure/memory -----
72480: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- Output from /proc/pressure/cpu -----
72481: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: some avg10=32.47 avg60=34.64 avg300=27.63 total=7506749248
72482: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: full avg10=0.00 avg60=0.00 avg300=0.00 total=0
72483: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- End output from /proc/pressure/cpu -----
72484: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- Output from /proc/pressure/io -----
72485: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: some avg10=11.89 avg60=7.51 avg300=6.47 total=1253462526
72486: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: full avg10=4.81 avg60=2.77 avg300=2.84 total=531822444
72487: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: ----- End output from /proc/pressure/io -----
72488: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: 
72489: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: CPU usage from 2ms to 23823ms later (2026-10-14 15:02:59.840 to 2026-10-14 15:03:23.661):
72490: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   38% 674/system_server: 4.6% user + 33% kernel / faults: 5800 minor 431 major
72491: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   31% 9418/com.google.android.inputmethod.latin: 12% user + 19% kernel / faults: 4380 minor 1527 major
72492: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   23% 414/android.hardware.graphics.composer3-service.ranchu: 0% user + 23% kernel
72493: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   23% 15924/host.exp.exponent: 1.1% user + 21% kernel / faults: 2240 minor 459 major
72494: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   18% 406/android.hardware.sensors-service.multihal: 0.2% user + 18% kernel
72495: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   18% 445/surfaceflinger: 0% user + 18% kernel / faults: 21 minor
72496: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   5.3% 15165/kworker/u12:2-events_unbound: 0% user + 5.3% kernel
72497: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   4.3% 16975/kworker/u9:1-events_unbound: 0% user + 4.3% kernel
72498: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   3.8% 10550/com.google.android.gms: 1.5% user + 2.3% kernel / faults: 208 minor 4 major
72499: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   3.5% 1824/com.android.systemui: 0.4% user + 3.1% kernel / faults: 202 minor 13 major
72500: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: 54% TOTAL: 3.6% user + 30% kernel + 20% iowait + 0.7% softirq
72501: 10-14 15:03:24.072  1000   674 17361 E ActivityManager: CPU usage from 513ms to 1525ms later (2026-10-14 15:03:00.351 to 2026-10-14 15:03:01.363):
72502: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   67% 674/system_server: 0% user + 67% kernel / faults: 438 minor
72503: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     63% 17362/AnrAuxiliaryTas: 1.2% user + 62% kernel
72504: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     1.2% 731/android.ui: 0% user + 1.2% kernel
72505: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:   55% 15924/host.exp.exponent: 0% user + 55% kernel / faults: 177 minor 84 major
72506: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     46% 15925/Signal Catcher: 15% user + 30% kernel
72507: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     3% 16012/binder:15924_3: 0% user + 3% kernel
72508: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     3% 16668/mqt_v_js: 0% user + 3% kernel
72509: 10-14 15:03:24.072  1000   674 17361 E ActivityManager:     3% 16692/GoogleApiHandle: 0% user + 3% kernel
```
