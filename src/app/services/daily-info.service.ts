import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';

import { map, switchMap } from 'rxjs/operators';
import {
  DailyInfo,
  DailyMeal,
  DailyMealWithSet,
} from '../interfaces/daily-info';
import { Set } from '../interfaces/set';
import { SetService } from './set.service';
import { Food } from '../interfaces/food';

@Injectable({
  providedIn: 'root',
})
export class DailyInfoService {
  constructor(
    private db: AngularFirestore,
    private snackBar: MatSnackBar,
    private router: Router,
    private setService: SetService
  ) {}

  getDailyInfos(authorId: string): Observable<DailyInfo[]> {
    return this.db
      .collection<DailyInfo>(`users/${authorId}/dailyInfos`, (ref) =>
        ref.orderBy('date', 'desc').limit(7)
      )
      .valueChanges();
  }
  getDailyInfo(authorId: string, date: string): Observable<DailyInfo> {
    return this.db
      .doc<DailyInfo>(`users/${authorId}/dailyInfos/${date}`)
      .valueChanges();
  }

  isTodayDailyInfo(userId: string, date: string): Observable<DailyInfo> {
    return this.db
      .collection<DailyInfo>(`users/${userId}/dailyInfos`, (ref) =>
        ref.where('date', '==', date)
      )
      .valueChanges()
      .pipe(
        map((isTodayDailyInfo) => {
          if (isTodayDailyInfo.length) {
            return isTodayDailyInfo[0];
          } else {
            return null;
          }
        })
      );
  }

  createDailyInfo(
    dailyInfo: Omit<
      DailyInfo,
      | 'dailyId'
      | 'currentWeight'
      | 'currentFat'
      | 'breakfast'
      | 'lunch'
      | 'dinner'
      | 'dailyMemo'
    >
  ) {
    this.getDailyInfo(dailyInfo.authorId, dailyInfo.date).subscribe((isdoc) => {
      if (!isdoc) {
        const dailyId = this.db.createId();
        return this.db
          .doc(`users/${dailyInfo.authorId}/dailyInfos/${dailyInfo.date}`)
          .set({
            dailyId,
            ...dailyInfo,
          })
          .then(() => {
            this.router.navigateByUrl('editor-list');
          });
      } else {
        this.router.navigateByUrl('editor-list');
      }
    });
  }

  updateDailyInfoBody(
    dailyInfo: Omit<DailyInfo, 'dailyId' | 'breakfast' | 'lunch' | 'dinner'>
  ): Promise<void> {
    return this.db
      .doc(`users/${dailyInfo.authorId}/dailyInfos/${dailyInfo.date}`)
      .set(dailyInfo, {
        merge: true,
      })
      .then(() => {
        this.snackBar.open('更新しました', null, {
          duration: 2000,
        });
      });
  }

  getSelectedFoodsOrSets(
    userId: string,
    date: string,
    whitchMeal: string
  ): Observable<DailyMealWithSet[]> {
    return this.db
      .collection<DailyMeal>(`users/${userId}/dailyInfos/${date}/${whitchMeal}`)
      .valueChanges()
      .pipe(
        switchMap((meals: DailyMeal[]) => {
          if (meals.length) {
            const setIds: string[] = [
              ...new Set(
                meals
                  .filter((meal) => meal.setId !== undefined)
                  .map((set) => set.setId)
              ),
            ];
            const sets$: Observable<Set[]> = combineLatest(
              setIds.map((setId: string) =>
                this.setService.getSetById(userId, setId)
              )
            );
            const foods: Food[] = [
              ...new Set(
                meals
                  .filter((meal) => meal.setId === undefined)
                  .map((food) => {
                    return food.food;
                  })
              ),
            ];
            if (setIds.length >= 1 && foods.length >= 1) {
              return combineLatest([of(meals), sets$, of(foods)]);
            } else if (setIds.length >= 1 && !foods.length) {
              return combineLatest([of(meals), sets$, of([])]);
            } else if (!setIds.length && foods.length >= 1) {
              return combineLatest([of(meals), of([]), of(foods)]);
            }
          } else {
            return of([]);
          }
        }),
        map(([meals, sets, foods]) => {
          if (meals?.length) {
            return meals.map((meal) => {
              if (!meal.setId) {
                return {
                  ...meal,
                  set: 'food',
                  ...foods,
                };
              } else if (!meal.food) {
                return {
                  ...meal,
                  set: sets.find((set) => set.setId === meal.setId),
                  food: 'set',
                };
              }
            });
          } else {
            return [];
          }
        })
      );
  }

  async addMeal(
    mealContet: Omit<DailyMeal, 'mealId'>,
    userId: string,
    date: string,
    whitchMeal: string
  ): Promise<void> {
    const mealId = this.db.createId();
    return this.db
      .doc(`users/${userId}/dailyInfos/${date}/${whitchMeal}/${mealId}`)
      .set({ ...mealContet, mealId })
      .then(() => {
        this.snackBar.open('追加しました', null, {
          duration: 2000,
        });
      });
  }

  deleteMeal(
    userId: string,
    date: string,
    mealId: string,
    whitchMeal: string
  ): Promise<void> {
    return this.db
      .doc(`users/${userId}/dailyInfos/${date}/${whitchMeal}/${mealId}`)
      .delete();
  }
}
