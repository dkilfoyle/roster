<template>
  <div class="column q-pb-lg q-pr-lg q-gutter-y-md">
    <div class="col text-center">
      Start Date:
      <span style="font-weight: bold">
        {{
          format(monthStore.startDate, 'yyyy-MM-dd')
        }}
      </span>
    </div>
    <div class="row q-gutter-x-md">
      <q-select
        label="Month"
        stack-label
        v-model="monthStore.month"
        emit-value
        map-options
        :options="[
          { label: 'Jan', value: 0 },
          { label: 'Feb', value: 1 },
          { label: 'Mar', value: 2 },
          { label: 'Apr', value: 3 },
          { label: 'May', value: 4 },
          { label: 'Jun', value: 5 },
          { label: 'Jul', value: 6 },
          { label: 'Aug', value: 7 },
          { label: 'Sep', value: 8 },
          { label: 'Oct', value: 9 },
          { label: 'Nov', value: 10 },
          { label: 'Dec', value: 11 },
        ]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
      <q-select
        label="Year"
        stack-label
        v-model="monthStore.year"
        :options="[2018, 2019, 2020, 2021, 2022, 2023, 2024]"
        filled
        dense
        class="col"
        options-dense
      ></q-select>
    </div>
    <q-select
      v-model="monthStore.version"
      :options="rosterStore.monthVersions"
      label="Version"
      dense
      filled
    >
      <template v-slot:after>
        <q-btn round size="sm" dense icon="more_horiz" :disable="monthStore.isArchived">
          <q-menu>
            <q-list style="padding-bottom: 0px">
              <q-item clickable v-close-popup @click="newVersion = true">
                <q-item-section>Add new</q-item-section>
              </q-item>
              <q-item
                v-if="monthStore.version != 'Final'"
                clickable
                v-close-popup
                @click="finaliseVersion = true"
              >
                <q-item-section>Finalise</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item clickable v-close-popup @click="deleteVersion = true">
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
    </q-select>
    <q-dialog v-model="newVersion">
      <q-card>
        <q-card-section class="text-subtitle1">Create a new version of {{ monthStore.monthName }}</q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="newVersionName" label="Name" autofocus></q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
          <q-btn
            flat
            label="Create"
            color="primary"
            v-close-popup
            @click="store.doCreateVersion(newVersionName)"
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="finaliseVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Finalise Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will make "{{ monthStore.version }}" the final version. This will
          OVERWRITE the existing final version. If you want to keep a backup of
          the current final version then cancel this operation and add a new
          copy of final.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="OK" color="primary" v-close-popup @click="store.doFinaliseVersion()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="deleteVersion">
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Version: Warning</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This will delete "{{ monthStore.version }}" permanently. Are you
          sure?"
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="OK" color="primary" v-close-popup @click="store.doDeleteVersion()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-btn
      color="secondary"
      :disable="monthStore.isArchived"
      @click="confirmNCT = true"
      icon="update"
      label="Load NCT and CRS"
    ></q-btn>
    <q-btn
      color="secondary"
      :disable="monthStore.isArchived"
      @click="rosterStore.anneal()"
      icon="update"
      label="Anneal"
    ></q-btn>
    <q-dialog v-model="confirmNCT" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Warning</div>
        </q-card-section>

        <q-card-section
          class="q-pt-none"
        >Generating NCT will overwrite any existing entries in the current month</q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Confirm"
            color="primary"
            @click="store.generateNCTandCRS"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-btn color="primary" @click="exportXLS" icon="file_download" label="Export Excel"></q-btn>
    <!-- <q-btn color="primary" @click="store.doDeleteNCT" icon="file_download" label="Delete NCT"></q-btn> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, watch, toRefs } from 'vue';
import { format, isFriday, isMonday } from 'date-fns';
import { useStore } from '../stores/store';
import { useMonthStore } from '../stores/monthStore';
import { useRosterStore } from '../stores/rosterStore';
import * as excelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useSMOStore } from 'src/stores/smoStore';

export default defineComponent({
  // name: 'ComponentName'
  setup() {
    const store = useStore();
    const monthStore = useMonthStore();
    const rosterStore = useRosterStore();
    const smoStore = useSMOStore();

    const state = reactive({
      confirmNCT: false,
      newVersion: false,
      finaliseVersion: false,
      deleteVersion: false,
      newVersionName: '',
    });

    // const startDate = computed(() => monthStore.startDate);

    watch(
      () => monthStore.startDate,
      () => {
        // console.log('monthOptions.watch(monthStore.startDate)', newVal);
        void store.onNewMonth();
      }
    );

    watch(
      () => ({ year: monthStore.year, month: monthStore.month }),
      (newVal) => {
        // console.log('monthOptions.watch(year,month)', newVal);
        monthStore.setMonth(newVal.year, newVal.month);
      }
    );

    const exportXLS = () => {
      const workbook = new excelJS.Workbook();
      workbook.modified = new Date();
      const sheet = workbook.addWorksheet(monthStore.monthName + (monthStore.version != 'Final' ? '_' + monthStore.version : ''));

      const solidFill = (color: string): excelJS.Fill => ({ type: 'pattern', pattern: 'solid' as excelJS.FillPatterns, fgColor: { argb: color } });
      const weekColor = ['FFCCFFCC', '00FFFFFF'];
      let weekColorSelector = true;

      function colName(num: number) {
        for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
          ret = String.fromCharCode((num % b) / a + 65) + ret;
        }
        return ret;
      }

      const colorWhite = 'FFFFFFFF';
      const colorBlue = 'FF3366FF';
      const colorRed = 'FFFF0000';
      const colorYellow = 'FFFFFF99';
      const colorOrange = 'FFFF6600';
      const colorGreen = 'FF006600';
      const colorLightGreen = 'FF92D050'
      const colorLightBlue = 'FF92CDDC';
      const colorPink = 'FFFF3399';
      const colorBlack = 'FF000000';
      const colorLightGrey = 'FFC0C0C0';
      const colorDarkGrey = 'ff808080';

      const activitySummary: Record<string, number> = {
        OPC: 0,
        DSR: 0,
        DSC: 0,
        ACT: 0,
        EMG: 0,
        TNP: 0
      };

      const pos = {
        dayRow: 2,
        dayStartCol: 3,
        dateRow: 3,
        dateStartCol: 3,
        timeCol: 2,
        smoCol: 1,
        actStartCol: 3,
        actStartRow: 4,
        actEndCol: 2 + monthStore.dates.length,
        actEndRow: 3 + smoStore.filteredSMOs2.length,
        sumStartCol: 2 + monthStore.dates.length + 2,
        sumStartRow: 4,
        sumEndCol: 2 + monthStore.dates.length + 1 + Object.keys(activitySummary).length,
        sumEndRow: 3 + smoStore.filteredSMOs2.length,
        sumSumStartCol: 2 + monthStore.dates.length + 2,
        sumSumStartRow: 3 + smoStore.filteredSMOs2.length + 1,
        smoStartRow: 4,
      }

      const activityFillColor = {
        TBH: colorGreen,
        ANL: colorOrange,
        CME: colorOrange,
        MS: colorPink,
        CRS_GP: colorBlack,
        CRS_ACT: colorLightGreen,
        BTX: colorRed,
        TNP: colorLightBlue,
        RT: colorLightBlue,
        WRE: colorBlue,
        TIL: colorOrange,
        'A+T': colorPink
      } as Record<string, string>;

      // Title
      const titleCell = sheet.getCell(1, 1)
      titleCell.value = 'Neurology Consultants Roster'
      titleCell.font = { color: { argb: colorRed }, bold: true, size: 18 };

      // Month title
      const monthCell = sheet.getCell(3, 1);
      monthCell.value = monthStore.monthName;
      monthCell.font = { color: { argb: colorWhite }, size: 15, bold: true }
      monthCell.fill = solidFill(colorBlue);
      monthCell.border = { bottom: { style: 'medium' } }

      // Cell above Time column
      sheet.getCell(3, 2).border = { bottom: { style: 'medium' } }

      // days and date headers
      monthStore.dates.forEach((date, i) => {

        const dayCell = sheet.getCell(pos.dayRow, pos.dayStartCol + i)
        dayCell.value = format(date, 'ccc');
        dayCell.font = { color: { argb: colorBlue }, bold: true };
        dayCell.alignment = { horizontal: 'center' }

        const dateCell = sheet.getCell(pos.dateRow, pos.dateStartCol + i);
        dateCell.alignment = { horizontal: 'center' };
        dateCell.value = format(date, 'd');
        dateCell.font = { color: { argb: colorWhite }, bold: true, size: 14 };
        dateCell.fill = solidFill(colorBlue);
        dateCell.border = { left: { style: 'medium', color: { argb: colorWhite } }, bottom: { style: 'medium' } }

        if (isMonday(date)) {
          dayCell.border = { ...dayCell.border, left: { style: 'medium' } }
          dateCell.border = { ...dateCell.border, left: { style: 'medium' } }
        }
      })


      const zeroActivitySummary = () => {
        activitySummary.OPC = 0;
        activitySummary.DSR = 0;
        activitySummary.DSC = 0;
        activitySummary.ACT = 0;
        activitySummary.EMG = 0;
        activitySummary.TNP = 0;
      }

      // activity summary headers
      Object.keys(activitySummary).forEach((activity, i) => {
        const sumCell = sheet.getCell(pos.sumStartRow - 1, pos.sumStartCol + i);
        sumCell.value = activity;
        sumCell.alignment = { horizontal: 'center' }
        sumCell.font = { bold: true };
        sumCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' } }
        if (!(i % 2)) sumCell.fill = solidFill(colorLightGrey);
      })

      smoStore.filteredSMOs2.forEach((smo, i) => {

        if (i % 2) {
          // Empty cell below SMO name
          sheet.getCell(pos.smoStartRow + i, 1).border = { bottom: { style: 'medium' } };
          // PM
          const pmCell = sheet.getCell(4 + i, 2)
          pmCell.value = 'PM';
          pmCell.border = { bottom: { style: 'medium' }, left: { style: 'medium' } };
          pmCell.fill = solidFill(colorBlue);
          pmCell.font = { color: { argb: colorWhite }, name: 'arial', size: 10 };
        } else {
          zeroActivitySummary();
          // smo name
          const smoCell = sheet.getCell(pos.smoStartRow + i, 1);
          smoCell.value = smo.fullName;
          smoCell.font = { color: { argb: colorBlue }, name: 'arial', size: 10 };
          // AM
          const amCell = sheet.getCell(4 + i, 2);
          amCell.value = 'AM';
          amCell.font = { color: { argb: colorBlue }, name: 'arial', size: 10 };
          amCell.border = { left: { style: 'medium' } };
        }

        monthStore.dates.forEach((date, j) => {
          const cell = sheet.getCell(pos.actStartRow + i, pos.actStartCol + j);

          if (j % 5 == 0) weekColorSelector = !weekColorSelector;
          cell.fill = solidFill(weekColor[weekColorSelector ? 1 : 0])

          if (store.isHoliday(date)) {
            cell.fill = solidFill(colorYellow);
            cell.border = { right: { style: 'medium' }, left: { style: 'medium' } }
            return;
          }

          const assignedEntries = rosterStore.filter({
            date,
            time: i % 2 ? 'PM' : 'AM',
            smo: smo.name
          }).filter((entry) => entry.activity != 'Call');

          cell.font = { color: { argb: colorRed }, size: 8, name: 'arial' };
          cell.alignment = { horizontal: 'center' };
          cell.border = { bottom: { style: i % 2 ? 'medium' : 'thin' }, left: { style: 'thin' } }

          if (assignedEntries.length && assignedEntries[0].activity) {
            const activity = assignedEntries[0].activity;
            if (!(activitySummary[activity] == undefined)) activitySummary[activity] = activitySummary[activity] + 1;

            if (activity == 'CRS_GP')
              cell.value = 'CRS'
            else if (activity == 'CRS_ACT')
              cell.value = 'CRS'
            else cell.value = activity;

            if (activityFillColor[activity]) {
              cell.fill = solidFill(activityFillColor[assignedEntries[0].activity]);
              cell.font.color = { argb: colorWhite }
            }
          }

          if (isMonday(date)) {
            cell.border = { ...cell.border, left: { style: 'medium' } }
          }

        });

        // function convertLetterToNumber(str: string) {
        //   str = str.toUpperCase();
        //   let out = 0, len = str.length;
        //   for (let pos = 0; pos < len; pos++) {
        //     out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
        //   }
        //   return out;
        // }



        // activity summaries
        if (!(i % 2)) {
          Object.keys(activitySummary).forEach((activity, k) => {
            const cell = sheet.getCell(pos.sumStartRow + i, pos.sumStartCol + k);
            const emptyCell = sheet.getCell(pos.sumStartRow + i + 1, pos.sumStartCol + k);
            cell.value = { formula: `COUNTIF((${colName(pos.actStartCol)}${pos.actStartRow + i}:${colName(pos.actEndCol)}${pos.actStartRow + i + 1}), "${activity}")`, date1904: true }; //activitySummary[activity] ? activitySummary[activity] : ''
            cell.numFmt = '[=0]"";General';
            cell.alignment = { horizontal: 'center' }
            cell.alignment = { horizontal: 'center' }
            cell.font = { bold: true };
            cell.border = { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' } }
            emptyCell.border = { left: { style: 'thin' } }
            if (!(k % 2)) {
              cell.fill = solidFill(colorLightGrey);
              emptyCell.fill = solidFill(colorLightGrey);
            }
          })
        }
      });

      // sum of sums
      Object.keys(activitySummary).forEach((activity, k) => {
        const cell = sheet.getCell(pos.sumEndRow + 1, pos.sumStartCol + k);
        cell.value = { formula: `sum(${colName(pos.sumStartCol + k)}${pos.sumStartRow}:${colName(pos.sumStartCol + k)}${pos.sumEndRow})`, date1904: true }
        cell.fill = solidFill(colorDarkGrey);
        cell.font = { color: { argb: colorWhite } }
        cell.border = { left: { style: 'thin' } }
        cell.alignment = { horizontal: 'center' }
      })

      // On Call
      const callCellA = sheet.getCell(pos.actEndRow + 1, pos.actStartCol - 2);
      callCellA.value = 'A Call';
      callCellA.font = { color: { argb: colorWhite }, bold: true }
      callCellA.fill = solidFill(colorBlack);
      let callCellB = sheet.getCell(pos.actEndRow + 2, pos.actStartCol - 2);
      callCellB.value = 'B Call';
      callCellB.font = { color: { argb: colorWhite }, bold: true }
      callCellB.fill = solidFill(colorBlack);
      monthStore.dates.forEach((date, i) => {
        const amCall = rosterStore.filter({
          date,
          activity: 'Call',
          time: 'AM'
        });
        const pmCall = rosterStore.filter({
          date,
          activity: 'Call',
          time: 'PM'
        });
        const cell = sheet.getCell(pos.actEndRow + 1, pos.actStartCol + i);
        cell.value = amCall.length ? amCall[0].smo : '?';
        cell.alignment = { horizontal: 'center' }
        cell.font = { color: { argb: colorWhite }, bold: true }
        cell.fill = solidFill(colorBlack);
        if (isFriday(date) || store.isHoliday(date)) {
          const pmCallCell = sheet.getCell(pos.actEndRow + 2, pos.actStartCol + i);
          pmCallCell.value = pmCall.length ? pmCall[0].smo : '?'
          pmCallCell.alignment = { horizontal: 'center' }
          pmCallCell.font = { color: { argb: colorWhite }, bold: true }
          pmCallCell.fill = solidFill(colorRed);
          cell.fill = solidFill(colorRed);
          cell.border = { bottom: { style: 'thin' } }
        }
      });

      sheet.getColumn(1).width = 18;
      sheet.getColumn(2).width = 4;
      monthStore.dates.forEach((date, i) => { sheet.getColumn(3 + i).width = 6 });
      Object.keys(activitySummary).forEach((_, i) => sheet.getColumn(pos.sumStartCol + i).width = 5)

      const createOuterBorder = (worksheet: excelJS.Worksheet, start = { row: 1, col: 1 }, end = { row: 1, col: 1 }, borderWidth: excelJS.BorderStyle = 'medium') => {
        const borderStyle = {
          style: borderWidth
        };
        for (let i = start.row; i <= end.row; i++) {
          const leftBorderCell = worksheet.getCell(i, start.col);
          const rightBorderCell = worksheet.getCell(i, end.col);
          leftBorderCell.border = {
            ...leftBorderCell.border,
            left: borderStyle
          };
          rightBorderCell.border = {
            ...rightBorderCell.border,
            right: borderStyle
          };
        }

        for (let i = start.col; i <= end.col; i++) {
          const topBorderCell = worksheet.getCell(start.row, i);
          const bottomBorderCell = worksheet.getCell(end.row, i);
          topBorderCell.border = {
            ...topBorderCell.border,
            top: borderStyle
          };
          bottomBorderCell.border = {
            ...bottomBorderCell.border,
            bottom: borderStyle
          };
        }
      }

      createOuterBorder(sheet, { row: 2, col: 1 }, { row: 3 + smoStore.filteredSMOs2.length, col: 2 + monthStore.dates.length });
      createOuterBorder(sheet, { row: pos.sumStartRow - 1, col: pos.sumStartCol }, { row: pos.sumEndRow + 1, col: pos.sumEndCol });

      void workbook.xlsx.writeBuffer().then(function (buffer) {
        const blob = new Blob([buffer], { type: 'applicationi/xlsx' });
        void saveAs(blob, `Roster_${monthStore.monthName.replace(' ', '')}.xlsx`);
      });
    };

    return {
      ...toRefs(state),
      store,
      monthStore,
      rosterStore,
      format,
      exportXLS
    };
  },
});
</script>

<style scoped>
.options {
  padding-bottom: 10px;
  padding-right: 10px;
}
</style>
