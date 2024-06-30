<script setup lang="ts">
import { v4 as uuid } from 'uuid';
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { Dialog, Editable, Label } from 'radix-vue/namespaced';
import { VisuallyHidden } from 'radix-vue';
import { Plan } from '@/data/resources';
import type { BoardInfo } from '@/data/resources';
import { defaultSeason, fallbackRange } from '@/utils/date';
import type { DeleteValue } from './providerKeys';
import FFDatePicker from '@/components/FFDatePicker.vue';
import IconPencil2 from '@/assets/radix-icons/pencil-2.svg?component';

const props = defineProps<{
  open: boolean,
  boardInfo?: BoardInfo,
}>();

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'update:save', value: Partial<BoardInfo> | BoardInfo): void,
  (e: 'update:cancel', value: Partial<BoardInfo> | undefined): void,
  (e: 'update:delete', value: DeleteValue): void,
}>();

const name = ref(props.boardInfo?.name || 'Untitled Board');
const dateRange = ref<[Date, Date]>(props.boardInfo?.dateRange || fallbackRange(defaultSeason));

const forceConfirm = () => {
  const selector = 'button.editable-trigger-submit'
  const btn = document.querySelector<HTMLButtonElement>(selector);
  if (btn) btn.click();
};
const editableRoot = ref(null);
onClickOutside(editableRoot, forceConfirm);

function confirmChanges() {
  if (!props.boardInfo) {
    const board: BoardInfo = {
      id: uuid(), type: Plan.FarmFlow,
      name: name.value, dateRange: dateRange.value,
    };
    emit('update:save', board);
  } else {
    const { id, type } = props.boardInfo;
    emit('update:save', { id, type, name: name.value, dateRange: dateRange.value });
  }
  emit('close');
}
function cancelChanges() {
  emit('update:cancel', props.boardInfo);
  emit('close');
}
</script>

<template>
  <Dialog.Root
    :open="open">

    <Dialog.Trigger asChild>
      <slot name="trigger" ></slot>
    </Dialog.Trigger>
    <Dialog.Portal>

      <Dialog.Overlay class="edit-dialog-overlay" />
      <Dialog.Content class="edit-dialog-content" >

        <Dialog.Title class="edit-dialog-title" >
          Edit Board Info
        </Dialog.Title>
        <VisuallyHidden>
          <Dialog.Description class="edit-dialog-description" >
            Make changes to the board name and date range.
          </Dialog.Description>
        </VisuallyHidden>

        <Label class="editable-label" for="edit-board-name">Board Name:</Label>
        <Editable.Root
          id="edit-board-name"
          ref="editableRoot"
          v-model="name"
          v-slot="{ isEditing }"
          placeholder="Untitled Board"
          submit-mode="enter"
          auto-resize
          class="editable-root" >
          <Editable.Area class="editable-area">
            <Editable.Preview class="editable-preview" />
            <Editable.Input class="editable-input" />
          </Editable.Area>
          <div class="editable-trigger-wrapper" >
            <Editable.EditTrigger v-if="!isEditing" class="editable-trigger-edit" >
              <span>
                <IconPencil2 />
              </span>
            </Editable.EditTrigger>
            <span v-else >
              <Editable.SubmitTrigger class="editable-trigger-submit">
                Done
              </Editable.SubmitTrigger>
              <Editable.CancelTrigger class="editable-trigger-cancel" >
                Reset
              </Editable.CancelTrigger>
            </span>
          </div>
        </Editable.Root>


        <FFDatePicker
          @change="dateRange[0] = $event"
          :value="dateRange[0]"
          class="edit-dialog-date-picker" />

        <FFDatePicker
          @change="dateRange[1] = $event"
          :value="dateRange[1]"
          class="edit-dialog-date-picker" />

        <div class="edit-dialog-btns">
          <button
            type="button"
            @click="cancelChanges"
            aria-label="Close"
            class="edit-dialog-btn btn-cancel">
            Cancel
          </button>
          <button
            type="button"
            @click="confirmChanges"
            aria-label="Save"
            class="edit-dialog-btn btn-save">
            Save
          </button>
        </div>

      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</template>

<style scoped>
/* reset */
button, input {
  all: unset;
}

.edit-dialog-close {
  font-family: inherit;
  border-radius: 100%;
  height: 15px;
  width: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ff-c-green);
  position: absolute;
  top: .5rem;
  right: .5rem;
}
.edit-dialog-close:hover {
  background-color: var(--ff-c-green-transparent-2);
}
.edit-dialog-close:focus {
  box-shadow: 0 0 0 2px var(--ff-c-green-transparent-2);
}

.edit-dialog-title {
  text-align: center;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}
.edit-dialog-overlay {
  background-color: var(--ff-c-black-transparent-1);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-dialog-content {
  background-color: var(--color-background-soft);
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 85vh;
  padding: 25px;
  width: 480px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-dialog-btns {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.edit-dialog-btns button.edit-dialog-btn,
.editable-trigger-submit,
.editable-trigger-cancel,
.editable-trigger-edit {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-wrap: nowrap;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: .375rem .75rem;
  margin-right: .375rem;
  margin-bottom: .375rem;
  border-radius: 4px;
  cursor: pointer;
}
.edit-dialog-btns button.edit-dialog-btn.btn-save,
.edit-dialog-btns button.edit-dialog-btn.btn-cancel:hover,
.editable-trigger-submit,
.editable-trigger-cancel:hover {
  color: var(--ff-c-green);
  background-color: var(--color-background);
}
.edit-dialog-btns button.edit-dialog-btn.btn-save:hover,
.editable-trigger-submit:hover {
  background-color: var(--ff-c-green-transparent-3);
}
.edit-dialog-btns button.edit-dialog-btn.btn-delete {
  border: none;
  color: var(--vt-c-red);
}
.edit-dialog-btns button.edit-dialog-btn.btn-delete:hover {
  box-shadow: 0 0 2px 1px var(--vt-c-red);
  background-color: var(--color-background);
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}


.editable-root {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-bottom: 1.125rem;
}

.editable-area {
  color: var(--color-heading);
  font-size: 30px;
  width: 240px;
  flex: auto;
}
.editable-preview {
  cursor: pointer;
}
.editable-input {
  cursor: text;
}

.editable-trigger-wrapper {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.editable-trigger-submit,
.editable-trigger-cancel,
.editable-trigger-edit {
  align-items: flex-end;
  margin: .375rem 0 0 .375rem;
  padding: .375rem .75rem;
}
.editable-trigger-edit {
  cursor: pointer;
  border: none;
}
.editable-trigger-edit svg {
  width: 24px;
  height: 24px;
  color: var(--color-text);
}

.edit-dialog-date-picker {
  margin-bottom: 1.125rem;
}
</style>