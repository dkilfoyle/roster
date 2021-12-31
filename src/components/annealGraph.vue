<template>
  <q-card style="width:1200px; max-width:80vw">
    <q-card-section horizontal>
      <q-card-section>
        <q-input v-model="annealParams.initialCost" label="Starting Cost" readonly></q-input>
        <q-input v-model="annealParams.runningCost" label="Running Cost" readonly></q-input>
        <!-- <q-input v-model="annealParams.TMax" label="TMax"></q-input>
        <q-field label="Tk" stack-label>
          <q-slider v-model="annealParams.Tk" :min="0.01" :max="1.2" :step="0.01" label></q-slider>
        </q-field>
        <q-input v-model="annealParams.TMin" label="TMin"></q-input>
        <q-field label="alpha" stack-label>
          <template v-slot:control>
            <q-slider v-model="annealParams.alpha" :min="0.8" :max="0.99" :step="0.01" label></q-slider>
          </template>
        </q-field>
        <q-input v-model="annealParams.reps" label="Iterations"></q-input>-->
        <q-field :label="`Temp Steps: ${annealParams.tempSteps}`" borderless stack-label>
          <q-slider v-model="annealParams.tempSteps" :min="50" :max="1000" :step="10"></q-slider>
        </q-field>
        <q-input v-model="annealParams.swapsPerStep" label="Swaps per Step" stack-label></q-input>
        <q-field
          :label="`Prob Accept Start ${annealParams.probAcceptWorseStart}`"
          borderless
          stack-label
        >
          <q-slider v-model="annealParams.probAcceptWorseStart" :min="0" :max="1" :step="0.01"></q-slider>
        </q-field>
        <q-input v-model="annealParams.probAcceptWorseEnd" label="Prob Accept End" stack-label></q-input>
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
import { defineComponent, computed, ref, reactive, onMounted } from 'vue';
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
  ActivityDefinition,
  RuleName,
  Solution,
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
      // TMax: 1,
      // TMin: 0.00001,
      // Tk: 0.8,
      // alpha: 0.9,
      // reps: 100,
      // xmax: 100,
      state: 'uninit',
      initialCost: 0,
      runningCost: 0,
      tempSteps: 100,
      swapsPerStep: 100,
      probAcceptWorseStart: 0.7,
      probAcceptWorseEnd: 0.001,
    });

    // const round = (x: number, digits: number) => Number(x.toFixed(digits));

    const tempStart = computed(() => -1.0 / Math.log(annealParams.probAcceptWorseStart));
    const tempEnd = computed(() => -1.0 / Math.log(annealParams.probAcceptWorseEnd));
    const tempAlpha = computed(() => (tempEnd.value / tempStart.value) ** (1.0 / (annealParams.tempSteps - 1)));


    onMounted(() => initAnneal());
    // watch(() => annealParams.Tk, (newVal) => {
    //   annealParams.TMax = Number((annealParams.initialCost * newVal).toFixed(1));
    // });

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
            // max: Math.log(annealParams.TMin / annealParams.TMax) /
            //   Math.log(annealParams.alpha),
            max: annealParams.tempSteps,
            min: 0,
            type: 'linear',
            steps: 10

          },
          y: {
            max: annealParams.initialCost * 1.2,
            min: 0,
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

    const isShufflable = (activity: ActivityDefinition) => {
      return activity.type != 'Leave' &&
        activity.name != 'Neuro' &&
        activity.name != 'Stroke' &&
        activity.name != 'CRS' &&
        activity.name != 'NCT' &&
        activity.name != 'Call' &&
        // activity.name != 'RT' &&
        activity.name != 'CRS_GP' &&
        activity.name != 'CRS_ACT' &&
        activity.name != 'MAN' &&
        activity.name != 'WDHB' &&
        activity.name != 'CDHB'
    }

    const shufflableActivities = activityStore.activities
      .filter(isShufflable)
    const shufflableActivityNames = shufflableActivities.map(x => x.name);

    const sol: Solution = { cost: 0, oldcost: 0 };

    const buildRandomSolution = () => {
      // build initial solution
      // fill sol with appropriate dates,times,smos excluding any unchangeable sessions such as leave/ward with random activity

      // calculate the number of each shufflable activity required for the whole month
      const activitiesPerMonth = shufflableActivities.map((activity) => {
        const perWeek = activity.perWeek ? Math.ceil((Array.isArray(activity.perWeek) ? activity.perWeek[0] : activity.perWeek) * monthStore.numWeeks) : 0;
        const perDay = activity.perDay ? (Array.isArray(activity.perDay) ? activity.perDay[0] : activity.perDay) * monthStore.numWorkingDays : 0;
        const perMonth = activity.perMonth ? Math.ceil((Array.isArray(activity.perMonth) ? activity.perMonth[0] : activity.perMonth) * monthStore.numWeeks / 4) : 0;
        const perSession = activity.perSession ? (Array.isArray(activity.perSession) ? activity.perSession[0] : activity.perSession) * ((activity.allowedDates?.AM.length || 0) + (activity.allowedDates?.PM.length || 0)) : 0;
        return { activity: activity.name, num: Math.max(perSession, perDay, perWeek, perMonth), perSession, perDay, perWeek, perMonth }
      })

      console.log('Activities per month: ', activitiesPerMonth)

      let activitiesSetNumber = new Array<string>();
      activitiesPerMonth.filter(x => x.num > 0).forEach(x => {
        for (let i = 0; i < x.num; i++) activitiesSetNumber.push(x.activity);
      });
      // randomize order
      for (let i = activitiesSetNumber.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activitiesSetNumber[i], activitiesSetNumber[j]] = [activitiesSetNumber[j], activitiesSetNumber[i]];
      }

      const activitiesAnyNumber = activitiesPerMonth.filter(x => x.num == 0).map(x => x.activity);

      console.log(activitiesSetNumber);

      let randomActivityNum = 0;
      monthStore.dates.forEach((date) => {
        if (store.isHoliday(date)) return;
        smoStore.activeSMOs.forEach((smo) => {
          if (smo.name == 'AM') return; // don't assign for AM as can work any day
          (['AM', 'PM'] as Array<Time>).forEach((time) => {

            // any pre-existing entries in roster month are considered fixed - they won't be selected for shuffling but are included for costing
            const fixedEntry =
              rosterStore.getRosterAtTime(date, time).find((entry) => {
                return (
                  entry.smo == smo.name
                );
              })

            // exclude session if not assignable to this SMO
            if (!fixedEntry && !smoStore.isAllowedTimeSMO(date, time, smo.name)) return;

            // choose a random (?allowable) activity
            const entry = {
              date,
              time,
              smo: smo.name,
              activity: fixedEntry?.activity || (randomActivityNum < activitiesSetNumber.length ? activitiesSetNumber[randomActivityNum++] : getRandomElement(activitiesAnyNumber)) || 'UnknownActivity',
              version: 'anneal',
              cost: 0,
              oldcost: 0,
              fixed: typeof fixedEntry != 'undefined'
            };


            const dateStr = 'D' + format(date, 'yyyyMMdd');
            const weekNum = getWeek(date) - getWeek(monthStore.startDate);
            const weekStr = 'W' + weekNum.toString();

            if (!sol.month) {
              sol.month = {
                weeks: {},
                cost: 0,
                oldcost: 0,
                activityCount: getZeroActivityCount(),
              }
            }

            if (!sol.month.weeks[weekStr])
              sol.month.weeks[weekStr] = {
                week: weekNum,
                cost: 0,
                oldcost: 0,
                dates: {},
                activityCount: getZeroActivityCount(),
              };

            if (!sol.month.weeks[weekStr].dates[dateStr])
              sol.month.weeks[weekStr].dates[dateStr] = {
                date,
                cost: 0,
                oldcost: 0,
                activityCount: getZeroActivityCount(),
              };

            if (!sol.month.weeks[weekStr].dates[dateStr][time])
              sol.month.weeks[weekStr].dates[dateStr][time] = {
                date,
                time,
                cost: 0,
                oldcost: 0,
                entries: [],
                activityCount: getZeroActivityCount(),
              };

            const session = sol.month.weeks[weekStr].dates[dateStr][time];
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
      let monthCost = 0;
      if (!sol.month) throw new Error('solution has not been initialised');
      Object.values(sol.month.weeks).forEach((week) => {
        Object.values(week.dates).forEach((day) => {
          (['AM', 'PM'] as Array<Time>).forEach((time) => {
            const session = day[time];
            if (session) {
              entriesCost += session.entries.reduce(
                (accum, entry) => accum + getEntryCost(entry),
                0
              );
              calcSessionActivityCount(session);
              sessionsCost += getSessionCost(session);
            }
          });
          calcDayActivityCount(day);
          daysCost += getDayCost(day);
        });
        calcWeekActivityCount(week);
        weeksCost += getWeekCost(week);
      });
      calcMonthActivityCount(sol.month);
      monthCost = getMonthCost(sol.month);

      console.log(sol, entriesCost, sessionsCost, daysCost, weeksCost, monthCost);
      const totalCost = entriesCost + sessionsCost + daysCost + weeksCost + monthCost;
      sol.oldcost = sol.cost;
      sol.cost = totalCost;

    };

    const calcAnnealParams = () => {
      annealParams.initialCost = sol.cost;
      // annealParams.TMax = Number((sol.cost * annealParams.Tk).toFixed(4));
      // annealParams.TMin = Number((annealParams.TMax * 0.00001).toFixed(4));
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
      buildRandomSolution();
      calcCost();
      calcAnnealParams();
      console.log(tempStart.value, tempEnd.value, tempAlpha.value)
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

      // let T = annealParams.TMax;
      // const T_min = annealParams.TMin;
      // const alpha = annealParams.alpha;
      let step = 1;
      let t = tempStart.value;
      let numaccepted = 1; // the initial solution

      annealParams.state = 'running';
      let deltaCost_avg = 0;

      annealCost.value.push(sol.cost);
      annealTemp.value.push(t);
      annealTempStep.value.push(step);
      annealAccepted.value.push(numaccepted)

      const doTempStep = () => {
        let i = 0;
        numaccepted = 0;

        while (i <= annealParams.swapsPerStep) {
          const a = getRandomEntry(sol);
          const b = getRandomEntry(sol);
          let accept = false;

          swap(sol, a, b);

          const deltaCost = Math.abs(getDeltaCost(sol));

          if (sol.cost > sol.oldcost) {
            // worse solution

            // if first swap init deltaCost_avg to abs(cost)
            if (step == 1 && i == 0) deltaCost_avg = deltaCost;
            const p = Math.exp(-deltaCost / (deltaCost_avg * t));
            accept = p > Math.random();
          } else {
            // better or equal solution
            accept = true;
          }

          if (accept) {
            numaccepted++;
            deltaCost_avg = (deltaCost_avg * (numaccepted - 1.0) + deltaCost) / numaccepted;
          } else {
            // swap rejected
            // reverse swap
            unswap(sol, a, b);
          }

          i += 1;
        }

        annealCost.value.push(sol.cost);
        annealTemp.value.push(t);
        annealTempStep.value.push(step);
        annealAccepted.value.push(numaccepted / annealParams.swapsPerStep * 100)
        annealParams.runningCost = sol.cost;

        step++;
        t = t * tempAlpha.value;

        if ((t > tempEnd.value) && annealParams.state == 'running') requestAnimationFrame(doTempStep); else {
          annealParams.state = 'ready';
        }
      }

      requestAnimationFrame(doTempStep);
      console.log(sol);
    };

    const getZeroActivityCount = () => {
      const activityCount: Record<string, number> = {};
      shufflableActivities.forEach((activity) => {
        activityCount[activity.name] = 0;
      });
      return activityCount;
    };

    const getRandomElement = <T>(arr: T[]) => {
      return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
    };

    const getRandomEntry = (sol: Solution) => {
      if (!sol.month) throw new Error('solution not initialised')
      let i = 0;
      while (i < 100) {
        i++;

        const week = getRandomElement(Object.values(sol.month.weeks));
        if (!week) continue;
        const day = getRandomElement(Object.values(week.dates));
        if (!day) continue;
        const time = getRandomElement(['AM', 'PM'] as Array<Time>);
        if (!time) continue;
        const session = day[time];
        if (!session) continue;
        const entry = getRandomElement(session.entries);
        if (entry && (entry.fixed || !shufflableActivityNames.includes(entry.activity))) continue;

        if (entry)
          return {
            oldActivity: '',
            month: sol.month,
            week,
            day,
            session,
            entry,
          };
      }
      throw new Error('Unable to find random entry after 100 iterations');
    };

    const changeActivityCount = (x: Costs, activity: string, delta: number) => {
      x.session.activityCount[activity] += delta;
      x.day.activityCount[activity] += delta;
      x.week.activityCount[activity] += delta;
      x.month.activityCount[activity] += delta;
    }

    const swapActivity = (a: Costs, b: Costs) => {

      // decrement the counts for the current activity
      changeActivityCount(a, a.entry.activity, -1);
      changeActivityCount(b, b.entry.activity, -1);

      // save the current activity
      a.oldActivity = a.entry.activity;
      b.oldActivity = b.entry.activity;

      // swap the activities
      a.entry.activity = b.oldActivity;
      b.entry.activity = a.oldActivity

      // increment the counts for the new activity
      changeActivityCount(a, a.entry.activity, 1);
      changeActivityCount(b, b.entry.activity, 1);

    }

    const calcCosts = (x: Costs) => {
      getEntryCost(x.entry);
      getSessionCost(x.session);
      getDayCost(x.day);
      getWeekCost(x.week);
      getMonthCost(x.month);
    }

    const getDeltaCosts = (x: Costs) => {
      return getDeltaCost(x.entry) +
        getDeltaCost(x.session) +
        getDeltaCost(x.day) +
        getDeltaCost(x.week) +
        getDeltaCost(x.month);
    }

    const reverseCosts = (x: Costs) => {
      x.month.cost = x.month.oldcost;
      x.week.cost = x.week.oldcost;
      x.day.cost = x.day.oldcost;
      x.session.cost = x.session.oldcost;
      x.entry.cost = x.entry.oldcost;
    }

    const swap = (sol: Solution, a: Costs, b: Costs) => {
      swapActivity(a, b);

      calcCosts(a);
      calcCosts(b);

      sol.oldcost = sol.cost;
      sol.cost += (getDeltaCosts(a) + getDeltaCosts(b));
    };

    const unswap = (sol: Solution, a: Costs, b: Costs) => {
      swapActivity(a, b);
      sol.cost = sol.oldcost;
      reverseCosts(a);
      reverseCosts(b);
    };

    const randomize = (sol: Solution, a: Costs) => {
      changeActivityCount(a, a.entry.activity, -1);

      a.oldActivity = a.entry.activity;
      a.entry.activity = getRandomElement(shufflableActivityNames) || 'UndefinedActivity';

      changeActivityCount(a, a.entry.activity, 1);

      calcCosts(a);
      sol.oldcost = sol.cost;
      sol.cost += getDeltaCosts(a);
    }

    const undoRandomize = (sol: Solution, a: Costs) => {
      changeActivityCount(a, a.entry.activity, -1);
      a.entry.activity = a.oldActivity;
      changeActivityCount(a, a.entry.activity, 1);

      sol.cost = sol.oldcost;
      reverseCosts(a);
    }

    // const acceptance_probability = (
    //   old_cost: number,
    //   new_cost: number,
    //   T: number
    // ) => {
    //   return Math.exp(-(new_cost - old_cost) / T);
    // };

    const getDeltaCost = (timespan: Cost) => {
      return timespan.cost - timespan.oldcost;
    };

    const getEntryCost = (entry: CostEntry) => {
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
      // if (smoStore.isAllowedTimeSMO(entry.date, entry.time, entry.smo) == false)
      //   cost += 1;

      entry.oldcost = entry.cost;
      entry.cost = cost;
      return cost;
    };

    const getTimespanCost = (
      activityCount: CostMonth | CostWeek | CostDate | CostSession,
      ruleName: RuleName
    ) => {
      let cost = 0;
      Object.keys(activityCount.activityCount).forEach((activityName) => {
        const rule = activityStore.getActivityRule(activityName, ruleName);
        const count = activityCount.activityCount[activityName];
        if (rule) {
          if (Array.isArray(rule)) {
            if (count < rule[0]) // count is less than minimum
              cost = cost + rule[0] - count;
            if (count > rule[1])
              cost = cost + count - rule[1];
          } else {
            if (count != rule)
              cost = cost + Math.abs(count - rule);
          }
        }
      });
      return cost;
    };

    const calcSessionActivityCount = (session: CostSession) => {
      const activityCount = session.activityCount;
      session.entries.forEach((entry) => {
        if (entry.activity in activityCount)
          activityCount[entry.activity] = activityCount[entry.activity] + 1;
      });
    }

    const getSessionCost = (session: CostSession) => {
      session.oldcost = session.cost;
      session.cost = getTimespanCost(session, 'perSession');
      return session.cost;
    };

    const calcDayActivityCount = (day: CostDate) => {
      day.activityCount = sumObjectsByKey([
        day.AM ? day.AM.activityCount : {},
        day.PM ? day.PM.activityCount : {},
      ]);
    }

    const getDayCost = (day: CostDate) => {
      day.oldcost = day.cost;
      day.cost = getTimespanCost(day, 'perDay');
      return day.cost;
    };

    const calcWeekActivityCount = (week: CostWeek) => {
      week.activityCount = sumObjectsByKey(
        Object.values(week.dates).map((day) => day.activityCount)
      );
    }

    const getWeekCost = (week: CostWeek) => {
      week.oldcost = week.cost;
      week.cost = getTimespanCost(week, 'perWeek');
      return week.cost;
    };

    const calcMonthActivityCount = (month: CostMonth) => {
      month.activityCount = sumObjectsByKey(
        Object.values(month.weeks).map((week) => week.activityCount)
      );
    }

    const getMonthCost = (month: CostMonth) => {
      month.oldcost = month.cost;
      month.cost = getTimespanCost(month, 'perMonth');
      return month.cost;
    }

    const sumObjectsByKey = (objs: Record<string, number>[]) => {
      return objs.reduce((a, b) => {
        for (const k in b) {
          if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k];
        }
        return a;
      }, {});
    };

    const exportAnneal = () => {
      rosterStore.delTempAnnealSolution();
      if (!sol.month) throw new Error('Solution Not initiailised')
      Object.values(sol.month.weeks).forEach(week => {
        Object.values(week.dates).forEach(date => {
          let entries = Array<CostEntry>();
          if (date.AM) entries = entries.concat(date.AM.entries);
          if (date.PM) entries = entries.concat(date.PM.entries);
          entries.forEach(entry => {
            rosterStore.addTempRosterEntry({
              date: entry.date,
              time: entry.time,
              smo: entry.smo,
              activity: entry.activity,
              version: entry.version + '_solution',
              notes: entry.cost > 0 ? entry.cost.toString() : ''
            })
          })
        })
      });
      emit('export')
    }

    return {
      lineChartProps, exportAnneal, annealLabel, annealClick, annealParams, emit, sol, initAnneal
    };
  }
});
</script>

<style lang="scss" scoped>
</style>
