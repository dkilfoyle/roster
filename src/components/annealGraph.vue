<template>
  <q-card style="width:1200px; max-width:80vw">
    <q-card-section horizontal>
      <q-card-section>
        <q-input v-model="annealParams.initialCost" label="Starting Cost" readonly></q-input>
        <q-input v-model="sol.cost" label="Running Cost" readonly></q-input>
        <q-input v-model="annealParams.TMax" label="TMax"></q-input>
        <q-field label="Tk" stack-label>
          <q-slider v-model="annealParams.Tk" :min="0.01" :max="1.2" :step="0.01" label></q-slider>
        </q-field>
        <q-input v-model="annealParams.TMin" label="TMin"></q-input>
        <q-field label="alpha" stack-label>
          <template v-slot:control>
            <q-slider v-model="annealParams.alpha" :min="0.8" :max="0.99" :step="0.01" label></q-slider>
          </template>
        </q-field>

        <q-input v-model="annealParams.reps" label="Iterations"></q-input>
      </q-card-section>
      <q-separator vertical inset></q-separator>
      <q-card-section class="col">
        <LineChart style="height:400px !important" v-bind="lineChartProps"></LineChart>
      </q-card-section>
    </q-card-section>
    <q-separator></q-separator>
    <q-card-actions align="right" class="q-my-sm">
      <q-btn color="secondary" label="Export" @click="exportAnneal"></q-btn>
      <q-btn color="negative" label="Cancel" @click="emit('cancel')"></q-btn>
      <q-btn color="primary" label="Init" @click="initAnneal"></q-btn>
      <q-btn color="primary" :label="annealLabel" @click="annealClick"></q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, reactive, onMounted, watch } from 'vue';
import { LineChart, useLineChart } from 'vue-chart-3';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import {
  CostEntry,
  CostSession,
  CostDate,
  CostMonth,
  Costs,
  Time,
  Cost,
  CostWeek,
} from 'src/stores/models';

import { useRosterStore } from 'src/stores/rosterStore';
import { useActivityStore } from 'src/stores/activityStore';
import { useMonthStore } from 'src/stores/monthStore';
import { useSMOStore } from 'src/stores/smoStore';
import { useStore } from 'src/stores/store';
import { getWeek, format } from 'date-fns';
Chart.register(...registerables);

export default defineComponent({
  name: 'annealGraph',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  components: { LineChart },
  setup(props, { emit }) {

    const rosterStore = useRosterStore();
    const activityStore = useActivityStore();
    const monthStore = useMonthStore();
    const smoStore = useSMOStore();
    const store = useStore();

    const annealParams = reactive({
      TMax: 1,
      TMin: 0.00001,
      Tk: 0.8,
      alpha: 0.9,
      reps: 100,
      xmax: 100,
      state: 'uninit',
      initialCost: 0,
      finalCost: 0,
    });

    onMounted(() => initAnneal());
    watch(() => annealParams.Tk, (newVal) => {
      annealParams.TMax = Number((annealParams.initialCost * newVal).toFixed(1));
    });

    const annealCost = ref(Array<number>());
    const annealTemp = ref(Array<number>());
    const annealTempStep = ref(Array<number>());
    const annealAccepted = ref(Array<number>());
    const annealAcceptedHigherCost = ref(Array<number>());
    const annealAcceptedLowerCost = ref(Array<number>());

    const chartData = computed<ChartData<'line'>>(() => {
      return {
        labels: [...annealTempStep.value], //annealProgress.value.map((prog) => prog.i),
        datasets: [
          {
            label: 'Cost',
            data: [...annealCost.value], //annealProgress.map((prog) => prog) }]
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgb(75, 192, 192)',
          },
          {
            label: 'Temp',
            data: [...annealTemp.value], //annealProgress.map((prog) => prog) }]
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132)',
          },
          {
            label: 'Accepted',
            data: [...annealAccepted.value], //annealProgress.map((prog) => prog) }]
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgb(153, 102, 255)',
            yAxisID: 'y2'
          }
        ]
      }
    });


    const chartOptions = computed<ChartOptions<'line'>>(() => {
      return {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            max: Math.log(annealParams.TMin / annealParams.TMax) /
              Math.log(annealParams.alpha),
            min: 0,
            type: 'linear',
            steps: 10

          },
          y: {
            max: annealParams.initialCost * 1.2,
            min: 0
          },
          y2: {
            max: 101,
            min: 0,
            type: 'linear',
            position: 'right',
            // grid line settings
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          }
        }
      }
    });

    const { lineChartProps } = useLineChart({
      chartData,
      options: chartOptions
    });

    const shufflableActivities = activityStore.activities
      .filter(
        (activity) =>
          activity.type != 'Leave' &&
          activity.name != 'Neuro' &&
          activity.name != 'Stroke' &&
          activity.name != 'CRS'
      )
      .map((x) => x.name);
    const sol: CostMonth = { cost: 0, oldcost: 0, weeks: {} };

    const buildRandomSolution = () => {
      // build initial solution
      // fill sol with appropriate dates,times,smos excluding any unchangeable sessions such as leave/ward with random activity
      monthStore.dates.forEach((date) => {
        if (store.isHoliday(date)) return;
        smoStore.activeSMOs.forEach((smo) => {
          (['AM', 'PM'] as Array<Time>).forEach((time) => {
            // exclude session if already assigned to Leave or Ward
            if (
              rosterStore.getRosterAtTime(date, time).some((entry) => {
                return (
                  entry.smo == smo.name &&
                  shufflableActivities.includes(entry.activity) == false
                );
              })
            )
              return;

            // choose a random (?allowable) activity
            const entry = {
              date,
              time,
              smo: smo.name,
              activity: getRandomElement(shufflableActivities) || 'UnknownActivity',
              version: 'anneal',
              cost: 0,
              oldcost: 0,
            };

            const dateStr = 'D' + format(date, 'yyyyMMdd');
            const week = getWeek(date) - getWeek(monthStore.startDate);
            const weekStr = 'W' + week.toString();

            getEntryCost(entry);

            if (!sol.weeks[weekStr])
              sol.weeks[weekStr] = {
                week,
                cost: 0,
                oldcost: 0,
                dates: {},
                activityCount: getZeroActivityCount(),
              };
            if (!sol.weeks[weekStr].dates[dateStr])
              sol.weeks[weekStr].dates[dateStr] = {
                date,
                cost: 0,
                oldcost: 0,
                activityCount: getZeroActivityCount(),
              };
            if (!sol.weeks[weekStr].dates[dateStr][time])
              sol.weeks[weekStr].dates[dateStr][time] = {
                date,
                time,
                cost: 0,
                oldcost: 0,
                entries: [entry],
                activityCount: getZeroActivityCount(),
              };

            const session = sol.weeks[weekStr].dates[dateStr][time];
            if (!session) throw new Error('Missing session');
            else session.entries.push(entry);
          });
        });
      });
    };

    const calcCost = () => {
      let entriesCost = 0;
      let sessionsCost = 0;
      let daysCost = 0;
      let weeksCost = 0;
      Object.values(sol.weeks).forEach((week) => {
        Object.values(week.dates).forEach((day) => {
          (['AM', 'PM'] as Array<Time>).forEach((time) => {
            const session = day[time];
            if (session) {
              entriesCost += session.entries.reduce(
                (accum, entry) => accum + getEntryCost(entry),
                0
              );
              sessionsCost += getSessionCost(session);
            }
          });
          daysCost += getDayCost(day);
        });
        weeksCost += getWeekCost(week);
      });
      // console.log(entriesCost, sessionsCost, daysCost, weeksCost);
      const totalCost = entriesCost + sessionsCost + daysCost + weeksCost;
      sol.oldcost = sol.cost;
      sol.cost = totalCost;
    };

    const calcAnnealParams = () => {
      annealParams.initialCost = sol.cost;
      annealParams.TMax = Number((sol.cost * annealParams.Tk).toFixed(4));
      annealParams.TMin = Number((annealParams.TMax * 0.00001).toFixed(4));
      annealParams.state = 'ready';
    };

    const annealLabel = computed(() => {
      switch (annealParams.state) {
        case 'ready': return 'Go';
        case 'running': return 'Stop';
        default: return 'Error'
      }
    })

    const annealClick = () => {
      switch (annealParams.state) {
        case 'ready': doAnneal(); break;
        case 'running': annealParams.state = 'ready'; break;
      }
    }

    const initAnneal = () => {
      sol.cost = 0;
      sol.oldcost = 0;
      sol.weeks = {};
      buildRandomSolution();
      calcCost();
      calcAnnealParams();
    };

    const doAnneal = () => {

      annealCost.value.splice(0, annealCost.value.length);
      annealTemp.value.splice(0, annealTemp.value.length);
      annealTempStep.value.splice(0, annealTempStep.value.length);
      annealAccepted.value.splice(0, annealAccepted.value.length);
      annealAcceptedHigherCost.value.splice(
        0,
        annealAcceptedHigherCost.value.length
      );
      annealAcceptedLowerCost.value.splice(0, annealAcceptedLowerCost.value.length);

      let T = annealParams.TMax;
      const T_min = annealParams.TMin;
      const alpha = annealParams.alpha;
      let frame = 0;

      annealParams.state = 'running';

      const doFrame = () => {
        let i = 1;
        frame++;
        // console.log(`T=${T.toFixed(3)}: StartCost=${sol.cost}`);
        let numlowercost = 0;
        let numhighercost = 0;
        let numrejected = 0;
        while (i <= 100) {
          const a = getRandomEntry(sol);
          const b = getRandomEntry(sol);

          swap(sol, a, b);

          if (getDeltaCost(sol) <= 0) {
            // keep swap
            numlowercost++;
          } else {
            const ap = acceptance_probability(sol.oldcost, sol.cost, T);
            // console.log(
            //   'ap: ',
            //   ap,
            //   sol.oldcost,
            //   sol.cost,
            //   this.getDeltaCost(sol)
            // );
            if (ap > Math.random()) {
              // keep swap despite higher cost
              // console.log('keep despite higher cost');
              numhighercost++;
            } else {
              // reject swap, revert to pre swap
              // console.log('reject');
              numrejected++;
              unswap(sol, a, b);
            }
          }

          i += 1;
        }
        annealCost.value.push(sol.cost);
        annealTemp.value.push(T);
        annealTempStep.value.push(frame);
        annealAccepted.value.push(numhighercost + numlowercost)
        T = T * alpha;
        if ((T > T_min) && annealParams.state == 'running') requestAnimationFrame(doFrame); else {
          annealParams.state = 'ready';
          annealParams.finalCost = sol.cost;
          console.log(
            `-- EndCost: ${sol.cost}`
          );
        }
      }

      requestAnimationFrame(doFrame);

    };

    const getZeroActivityCount = () => {
      const activityStore = useActivityStore();
      const activityCount: Record<string, number> = {};
      activityStore.activityNames.forEach((activity) => {
        activityCount[activity] = 0;
      });
      return activityCount;
    };

    const getRandomElement = <T>(arr: T[]) => {
      return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
    };

    const getRandomEntry = (sol: CostMonth) => {
      let i = 0;
      while (i < 100) {
        i++;

        const week = getRandomElement(Object.values(sol.weeks));
        if (!week) continue;
        const day = getRandomElement(Object.values(week.dates));
        if (!day) continue;
        const time = getRandomElement(['AM', 'PM'] as Array<Time>);
        if (!time) continue;
        const session = day[time];
        if (!session) continue;
        const entry = getRandomElement(session.entries);

        if (entry)
          return {
            week,
            day,
            session,
            entry,
          };
      }
      throw new Error('Unable to find random entry after 100 iterations');
    };

    const swap = (sol: CostMonth, a: Costs, b: Costs) => {
      // swap activity

      // console.log('Preswap');
      // console.log('a.entry: ', a.entry.smo, a.entry.activity, a.entry.cost);
      // console.log('b.entry: ', b.entry.smo, b.entry.activity, b.entry.cost);

      a.session.activityCount[a.entry.activity] -= 1;
      b.session.activityCount[b.entry.activity] -= 1;
      a.day.activityCount[a.entry.activity] -= 1;
      b.day.activityCount[b.entry.activity] -= 1;
      a.week.activityCount[a.entry.activity] -= 1;
      b.week.activityCount[b.entry.activity] -= 1;

      const entry1activity = a.entry.activity;
      a.entry.activity = b.entry.activity;
      b.entry.activity = entry1activity;

      a.session.activityCount[a.entry.activity] += 1;
      b.session.activityCount[b.entry.activity] += 1;
      a.day.activityCount[a.entry.activity] += 1;
      b.day.activityCount[b.entry.activity] += 1;
      a.week.activityCount[a.entry.activity] += 1;
      b.week.activityCount[b.entry.activity] -= 1;

      getEntryCost(a.entry);
      getEntryCost(b.entry);
      getSessionCost(a.session);
      getSessionCost(b.session);
      getDayCost(a.day);
      getDayCost(b.day);
      getWeekCost(a.week);
      getWeekCost(b.week);

      // console.log('Postswap');
      // console.log(
      //   'a.entry: ',
      //   a.entry.smo,
      //   a.entry.activity,
      //   a.entry.cost,
      //   this.getDeltaCost(a.entry)
      // );
      // console.log(
      //   'b.entry: ',
      //   b.entry.smo,
      //   b.entry.activity,
      //   b.entry.cost,
      //   this.getDeltaCost(b.entry)
      // );

      sol.oldcost = sol.cost;
      sol.cost +=
        getDeltaCost(a.entry) +
        getDeltaCost(b.entry) +
        getDeltaCost(a.session) +
        getDeltaCost(b.session) +
        getDeltaCost(a.day) +
        getDeltaCost(b.day) +
        getDeltaCost(a.week) +
        getDeltaCost(b.week);
    };

    const unswap = (sol: CostMonth, a: Costs, b: Costs) => {
      sol.cost = sol.oldcost;
      a.week.cost = a.week.oldcost;
      b.week.cost = b.week.oldcost;
      a.day.cost = a.day.oldcost;
      b.day.cost = b.day.oldcost;
      a.session.cost = a.session.oldcost;
      b.session.cost = b.session.oldcost;
      a.entry.cost = a.entry.oldcost;
      b.entry.cost = b.entry.oldcost;
      const entry1oldactivity = a.entry.activity;
      a.entry.activity = b.entry.activity;
      b.entry.activity = entry1oldactivity;
    };

    const acceptance_probability = (
      old_cost: number,
      new_cost: number,
      T: number
    ) => {
      return Math.exp(-(new_cost - old_cost) / T);
    };

    const getDeltaCost = (timespan: Cost) => {
      return timespan.cost - timespan.oldcost;
    };

    const getEntryCost = (entry: CostEntry) => {
      const smoStore = useSMOStore();
      const activityStore = useActivityStore();
      let cost = 0;

      // smo is not capable of this activity
      if (smoStore.getSMO(entry.smo).activities.includes(entry.activity) == false)
        cost += 3;

      // activity is not rosterable at this time
      if (
        activityStore.isAllowedActivity(entry.date, entry.time, entry.activity) ==
        false
      )
        cost += 2;

      // smo is not rosterable at this time
      if (smoStore.isAllowedTimeSMO(entry.date, entry.time, entry.smo) == false)
        cost += 1;

      entry.oldcost = entry.cost;
      entry.cost = cost;
      return cost;
    };

    const getTimespanCost = (
      timespan: CostWeek | CostDate | CostSession,
      rule: string
    ) => {
      const activityStore = useActivityStore();
      let cost = 0;
      Object.keys(timespan.activityCount).forEach((activityName) => {
        const activity = activityStore.getActivity(activityName) as Record<
          string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any
        >;
        if (activity && activity[rule]) {
          if (Array.isArray(activity.rule)) {
            if (timespan.activityCount[activityName] < activity.rule[0])
              cost = cost + 1;
            if (timespan.activityCount[activityName] > activity.rule[1])
              cost = cost + 1;
          } else {
            if (timespan.activityCount[activityName] != activity.rule)
              cost = cost + 1;
          }
        }
      });
      return cost;
    };

    const getSessionCost = (session: CostSession) => {
      const activityCount = session.activityCount;
      session.entries.forEach((entry) => {
        if (activityCount[entry.activity])
          activityCount[entry.activity] = activityCount[entry.activity] + 1;
      });

      session.oldcost = session.cost;
      session.cost = getTimespanCost(session, 'perSession');
      return session.cost;
    };

    const getDayCost = (day: CostDate) => {
      day.activityCount = sumObjectsByKey([
        day.AM ? day.AM.activityCount : {},
        day.PM ? day.PM.activityCount : {},
      ]);

      day.oldcost = day.cost;
      day.cost = getTimespanCost(day, 'perDay');
      return day.cost;
    };

    const getWeekCost = (week: CostWeek) => {
      week.activityCount = sumObjectsByKey(
        Object.values(week.dates).map((day) => day.activityCount)
      );

      week.oldcost = week.cost;
      week.cost = getTimespanCost(week, 'perWeek');
      return week.cost;
    };

    const sumObjectsByKey = (objs: Record<string, number>[]) => {
      return objs.reduce((a, b) => {
        for (const k in b) {
          if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k];
        }
        return a;
      }, {});
    };

    const exportAnneal = () => {
      console.log('exportAnneal - TODO')
    }


    return {
      lineChartProps, exportAnneal, annealLabel, annealClick, annealParams, emit, sol, initAnneal
    };
  }
});
</script>

<style lang="scss" scoped>
</style>
