<script setup lang="ts">
import { inject, ref } from 'vue'
import { Menubar } from 'radix-vue/namespaced';
import FlowBoardDialogEditBoardInfo from '@/components/FlowBoardDialogEditBoardInfo.vue';
import FlowBoardDialogEditTask from '@/components/FlowBoardDialogEditTask.vue';
import FlowBoardDialogImportBoard from '@/components/FlowBoardDialogImportBoard.vue';
import { boardIndexKey, boardsKey, locationsKey, operationsKey, plantsKey } from '@/components/providerKeys';
import type { CreateValue } from '@/components/providerKeys';
import type { BoardInfo, LogResource } from '@/data/resources';
import type { BoardData } from '@/data/deserialize';
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconCheck from '@/assets/radix-icons/check.svg?component';
import IconDotFilled from '@/assets/radix-icons/dot-filled.svg?component';

const currentMenu = ref('')
const checkboxOne = ref(false)
const checkboxTwo = ref(false)
const locations = inject(locationsKey, ref([]));
const operations = inject(operationsKey, ref([]));
const plants = inject(plantsKey, ref([]));
const boardIndex = inject(boardIndexKey, ref(0));
const boards = inject(boardsKey, ref([]));
const boardRadio = ref<string>(boardIndex.value.toString());
const emit = defineEmits<{
  (e: 'export-board'): void,
  (e: 'import-board', value: BoardData): void,
  (e: 'select-board', value: number): void,
  (e: 'create-task', value: CreateValue): void,
  (e: 'update-board-info', value: Partial<BoardInfo>): void,
}>();

function handleSelectBoard(evt: any) {
  if (['string', 'number'].includes(typeof evt)) {
    emit('select-board', +evt as number);
  }
}

const openEditBoardDialog = ref(false);
const openNewBoardDialog = ref(false);
function saveBoardInfo(info: Partial<BoardInfo>) {
  emit('update-board-info', info);
  currentMenu.value = '';
  openNewBoardDialog.value = false;
  openEditBoardDialog.value = false;
}

const openImportBoardDialog = ref(false);
function importBoard(data: BoardData) {
  emit('import-board', data);
  currentMenu.value = '';
  openImportBoardDialog.value = false;
}
function exportBoard() {
  emit('export-board');
  currentMenu.value = '';
}

const openEditTaskDialog = ref(false);
function saveNewTask(task: LogResource) {
  emit('create-task', task);
  currentMenu.value = '';
  openEditTaskDialog.value = false;
}
function cancelEdits() {
  currentMenu.value = '';
  openNewBoardDialog.value = false;
  openEditTaskDialog.value = false;
  openEditBoardDialog.value = false;
  openImportBoardDialog.value = false;
}

</script>

<template>
  <Menubar.Root v-model="currentMenu" class="MenubarRoot">
    <Menubar.Menu value="Board">
      <Menubar.Trigger
        class="MenubarTrigger">
        Board
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-3">
          <FlowBoardDialogEditBoardInfo
            @update:save="saveBoardInfo"
            @update:cancel="cancelEdits"
            :open="openNewBoardDialog" >
            <template #trigger >
              <Menubar.Item
                @select.prevent="openNewBoardDialog = true"
                class="MenubarItem" >
                New Board
                <!-- TODO: Implement key bindings. -->
                <!-- <div class="RightSlot">⌘ N</div> -->
              </Menubar.Item>
            </template>
          </FlowBoardDialogEditBoardInfo>

          <Menubar.Item class="MenubarItem" disabled>
            Duplicate
          </Menubar.Item>

          <FlowBoardDialogImportBoard
            @update:save="importBoard"
            @update:cancel="cancelEdits"
            :open="openImportBoardDialog" >
            <template #trigger >
              <Menubar.Item
                @select.prevent="openImportBoardDialog = true"
                class="MenubarItem" >
                Import Data
              </Menubar.Item>
            </template>
          </FlowBoardDialogImportBoard>

          <Menubar.Item class="MenubarItem" @click="exportBoard" >
            Export Data
          </Menubar.Item>

          <Menubar.Separator class="MenubarSeparator" />

          <Menubar.Sub>
            <Menubar.SubTrigger class="MenubarItem">
              Recent
              <div class="RightSlot">
                <IconChevronRight />
              </div>
            </Menubar.SubTrigger>

            <Menubar.Portal>
              <Menubar.SubContent
                class="MenubarContent"
                :align-offset="-5">
                <Menubar.RadioGroup
                  v-model="boardRadio"
                  @update:model-value="handleSelectBoard">

                  <Menubar.RadioItem
                    v-for="(board, i) in boards"
                    class="MenubarCheckboxItem inset"
                    :value="i.toString()"
                    :key="`menu-radio-item-board-${i}`">
                    <Menubar.ItemIndicator class="MenubarItemIndicator">
                      <IconDotFilled />
                    </Menubar.ItemIndicator>
                    {{ board.name }}
                  </Menubar.RadioItem>

                </Menubar.RadioGroup>
              </Menubar.SubContent>
            </Menubar.Portal>
          </Menubar.Sub>

          <Menubar.Separator class="MenubarSeparator" />

          <FlowBoardDialogEditBoardInfo
            @update:save="saveBoardInfo"
            @update:cancel="cancelEdits"
            :board-info="boards[boardIndex]"
            :open="openEditBoardDialog" >
            <template #trigger >
              <Menubar.Item
                @select.prevent="openEditBoardDialog = true"
                class="MenubarItem" >
                Edit Board Info
              </Menubar.Item>
            </template>
          </FlowBoardDialogEditBoardInfo>

          <Menubar.Item class="MenubarItem" disabled>
            Preferences
          </Menubar.Item>

          <Menubar.Item class="MenubarItem" disabled>
            Reports
          </Menubar.Item>

        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Tasks
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-14">
          <FlowBoardDialogEditTask
            @update:save="saveNewTask($event as LogResource)"
            @update:cancel="cancelEdits"
            :open="openEditTaskDialog"
            :operations="operations"
            :locations="locations"
            :plants="plants" >
            <template #trigger >
              <Menubar.Item
                @select.prevent="openEditTaskDialog = true"
                class="MenubarItem" >
                New Task
                <!-- TODO: Implement key bindings. -->
                <!-- <div class="RightSlot">⌘ T</div> -->
              </Menubar.Item>
            </template>
          </FlowBoardDialogEditTask>
          <Menubar.Separator class="MenubarSeparator" />
          <Menubar.Item class="MenubarItem" disabled>
            Organize Task Categories
          </Menubar.Item>
          <Menubar.Item class="MenubarItem" disabled>
            Standard Operating Procedures
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Locations
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-3">
          <Menubar.Item class="MenubarItem" disabled>
            Sort
          </Menubar.Item>
          <Menubar.Item class="MenubarItem" disabled>
            Filter
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Timeline
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-14">
          <Menubar.CheckboxItem
            v-model:checked="checkboxOne"
            disabled
            class="MenubarCheckboxItem inset">
            <Menubar.ItemIndicator class="MenubarItemIndicator">
              <IconCheck />
            </Menubar.ItemIndicator>
            Show Months
          </Menubar.CheckboxItem>
          <Menubar.CheckboxItem
            v-model:checked="checkboxTwo"
            disabled
            class="MenubarCheckboxItem inset">
            <Menubar.ItemIndicator class="MenubarItemIndicator">
              <IconCheck />
            </Menubar.ItemIndicator>
            Show Rainfall
          </Menubar.CheckboxItem>
          <Menubar.Separator class="MenubarSeparator" />
          <Menubar.Item class="MenubarItem inset" disabled>
            Jump to date...
            <div class="RightSlot">
              ⌘ J
            </div>
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

  </Menubar.Root>
</template>

<style scoped>
/* reset */
button {
  all: unset;
}

.MenubarRoot {
  display: flex;
  background-color: var(--color-background-soft);
  padding: .125rem;
  border-radius: .375rem;
  box-shadow: 0 0px .375rem -.375rem var(--color-box-shadow-2);
}

:deep(.MenubarTrigger) {
  padding: .125rem .75rem;
  outline: none;
  user-select: none;
  font-weight: 500;
  line-height: 1.5;
  border-radius: 4px;
  color: var(--ff-c-green);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  cursor: pointer;
}

:deep(.MenubarTrigger)[data-highlighted],
:deep(.MenubarTrigger)[data-state='open'] {
  background-color: var(--ff-c-green-transparent-3);
}

:deep(.MenubarContent),
:deep(.MenubarSubContent) {
  min-width: 220px;
  background-color: var(--color-background-soft);
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

:deep(.MenubarItem),
:deep(.MenubarSubTrigger),
:deep(.MenubarCheckboxItem),
:deep(.MenubarRadioItem) {
  all: unset;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ff-c-green);
  border-radius: 4px;
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  position: relative;
  user-select: none;
}

:deep(.MenubarItem).inset,
:deep(.MenubarSubTrigger).inset,
:deep(.MenubarCheckboxItem).inset,
:deep(.MenubarRadioItem).inset {
  padding-left: 20px;
}

:deep(.MenubarItem)[data-state='open'],
:deep(.MenubarSubTrigger)[data-state='open'] {
  background-color: var(--ff-c-green-transparent-2);
  color: var(--ff-c-green);
}

:deep(.MenubarItem)[data-highlighted],
:deep(.MenubarSubTrigger)[data-highlighted],
:deep(.MenubarCheckboxItem)[data-highlighted],
:deep(.MenubarRadioItem)[data-highlighted] {
  background-color: var(--ff-c-green-transparent-2);
  color: white;
}

:deep(.MenubarItem)[data-disabled],
:deep(.MenubarSubTrigger)[data-disabled],
:deep(.MenubarCheckboxItem)[data-disabled],
:deep(.MenubarRadioItem)[data-disabled] {
  color: var(--mauve-8);
  pointer-events: none;
}

:deep(.MenubarItemIndicator) {
  position: absolute;
  left: 0;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.MenubarSeparator) {
  height: 1px;
  background-color: var(--grass-6);
  margin: 5px;
}

:deep(.RightSlot) {
  margin-left: auto;
  padding-left: 20px;
  color: var(--mauve-9);
}

[data-highlighted] > :deep(.RightSlot) {
  color: white;
}

[data-disabled] > :deep(.RightSlot) {
  color: var(--mauve-8);
}
</style>
