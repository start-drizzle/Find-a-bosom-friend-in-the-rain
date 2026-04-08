<template>
  <section
    class="flex-1 p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-hidden bg-surface-container-low h-full texture-bg relative"
  >
    <!-- Left Panel: Dialog Area (span 7) -->
    <div class="lg:col-span-7 flex flex-col min-h-0 h-full relative z-10">
      <!-- Title Area -->
      <div class="mb-10 flex-shrink-0 relative">
        <div class="flex items-end gap-6">
          <h2 class="text-[40px] font-black font-headline text-primary tracking-tight leading-none">
            实时翻译<span class="text-primary/40">.</span>
          </h2>
          <div class="flex-1 h-px bg-gradient-to-r from-primary/20 via-slate-200/50 to-transparent mb-2"></div>
        </div>
        <p class="text-[10px] font-bold text-primary/40 tracking-[0.3em] uppercase mt-2">
          Real-time Neural Translation
        </p>
      </div>

      <!-- Dialog Scroll Area -->
      <DialogList
        ref="dialogListRef"
        :bubbles="bubbles"
        :current-src="currentSrc"
        :current-trg="currentTrg"
        :bubble-finalizing="bubbleFinalizing"
      />

      <!-- Terminal Input -->
      <div class="mt-4">
        <TerminalInput
          v-model="inputText"
          @enter="handleEnter"
          @end-bubble="endBubble"
          @new-bubble="newBubble"
        />
      </div>
    </div>

    <!-- Divider Line with Architectural Details -->
    <div class="hidden lg:flex absolute left-[58.33%] top-0 bottom-0 flex-col items-center z-0 opacity-60">
      <div class="h-16 w-px bg-gradient-to-b from-transparent to-slate-200/80"></div>
      <div class="w-1.5 h-1.5 rounded-full bg-white border border-slate-200 shadow-sm my-4"></div>
      <div class="flex-1 w-px bg-slate-200/80"></div>
      <div class="w-1.5 h-1.5 rounded-full bg-white border border-slate-200 shadow-sm my-4"></div>
      <div class="h-32 w-px bg-gradient-to-b from-slate-200/80 to-transparent"></div>
    </div>

    <!-- Right Panel: Controls & Interaction -->
    <div class="lg:col-span-5 flex flex-col h-full relative z-10 pl-4 lg:pl-10">
      <!-- Language Selector -->
      <VoiceLanguageSelector v-model="sourceLanguage" />

      <!-- Center: Giant Mic Button -->
      <div class="flex-1 flex flex-col items-center justify-center relative -mt-8">
        <!-- Microphone Dropdown -->
        <div class="mb-4">
          <MicrophoneDropdown
            v-model="selectedDeviceId"
            :devices="availableDevices"
          />
        </div>

        <AnimeMicButton
          :is-recording="isRecording"
          @toggle="toggleRecording"
        />
      </div>

      <!-- Bottom Right: Status Chip -->
      <div class="absolute bottom-6 right-6 z-20">
        <StatusChip latency="0.68ms" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DialogList from '@/components/voice/DialogList.vue';
import TerminalInput from '@/components/voice/TerminalInput.vue';
import AnimeMicButton from '@/components/voice/AnimeMicButton.vue';
import VoiceLanguageSelector from '@/components/voice/VoiceLanguageSelector.vue';
import StatusChip from '@/components/voice/StatusChip.vue';
import MicrophoneDropdown from '@/components/voice/MicrophoneDropdown.vue';
import { useChatBubbles } from '@/composables/useChatBubbles';
import { useRecording } from '@/composables/useRecording';

// --- Language state ---
const sourceLanguage = ref('auto');

// --- Chat bubbles ---
const dialogListRef = ref<{ scrollToBottom: () => void } | null>(null);
const {
  inputText,
  bubbles,
  currentSrc,
  currentTrg,
  bubbleFinalizing,
  updateCurrentSrc,
  endBubble,
  resetAll: resetBubbles,
  handleEnter,
} = useChatBubbles({ dialogListRef });

// --- Recording ---
const {
  isRecording,
  availableDevices,
  selectedDeviceId,
  toggleRecording,
} = useRecording({
  sourceLanguage,
  updateCurrentSrc,
  endBubble,
  resetBubbles,
  currentSrc,
});

// --- Template event handlers ---
function newBubble() { endBubble(); }
</script>
