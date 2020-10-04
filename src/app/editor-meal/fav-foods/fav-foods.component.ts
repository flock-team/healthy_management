import { Component, OnInit, OnDestroy } from '@angular/core';
import { FoodService } from 'src/app/services/food.service';
import { Food } from 'src/app/interfaces/food';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { DailyMeal } from 'src/app/interfaces/daily-info';
import { DailyInfoService } from 'src/app/services/daily-info.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { AverageService } from 'src/app/services/average.service';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MealInputComponent } from 'src/app/bottom-sheet/meal-input/meal-input.component';
import { MainShellService } from 'src/app/services/main-shell.service';

@Component({
  selector: 'app-fav-foods',
  templateUrl: './fav-foods.component.html',
  styleUrls: ['./fav-foods.component.scss'],
})
export class FavFoodsComponent implements OnInit, OnDestroy {
  private lastDoc: QueryDocumentSnapshot<Food>;
  private getNumber = 10;
  private subscription = new Subscription();

  selectedMealsNum: number;
  maxSelectNum = 50;
  amount = [].fill(0);
  date: string;
  meal: string;
  favFoods: Food[] = new Array();
  loading: boolean;
  isNext: boolean;
  minAmount = 0;
  maxAmount = 10000;
  amountForm = this.fb.group({
    amount: [
      0,
      [Validators.min(this.minAmount), Validators.max(this.maxAmount)],
    ],
  });
  get amountControl(): FormControl {
    return this.amountForm.get('amount') as FormControl;
  }

  constructor(
    private foodService: FoodService,
    private authService: AuthService,
    private dailyInfoService: DailyInfoService,
    private route: ActivatedRoute,
    private router: Router,
    private averageService: AverageService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet,
    private mainShellService: MainShellService
  ) {
    const routeSub = this.route.queryParamMap.subscribe((paramMaps) => {
      this.date = paramMaps.get('date');
      this.meal = paramMaps.get('meal');
      this.getFoods();
    });
    const selectedSub = this.getSelectedMeals();
    const routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.averageService.averageTotalCal(this.authService.uid, this.date);
      }
    });
    this.subscription.add(routeSub);
    this.subscription.add(selectedSub);
    this.subscription.add(routerSub);
  }

  addFood(amount: number, food: Food) {
    if (amount >= 0) {
      const meal: DailyMeal = { mealId: '', food, amount };
      this.dailyInfoService.addMeal(
        meal,
        this.authService.uid,
        this.date,
        'food'
      );
    } else {
      this.snackBar.open('数値を入力してください', null, {
        duration: 2000,
      });
    }
  }

  getFoods() {
    this.loading = true;
    this.foodService
      .getFavFoods(this.authService.uid, this.getNumber, this.lastDoc)
      .pipe(take(1))
      .subscribe((foods) => {
        if (foods && foods.length > 0) {
          foods.forEach(
            (food: {
              data: Food;
              nextLastDoc: QueryDocumentSnapshot<Food>;
            }) => {
              this.favFoods.push(food.data);
              this.lastDoc = food.nextLastDoc;
            }
          );
          foods.length >= this.getNumber
            ? (this.isNext = true)
            : (this.isNext = false);
        } else {
          this.isNext = false;
        }
        this.loading = false;
      });
  }

  unLikeFavFood(foodId: string, index: number) {
    this.foodService.unLikeFavFood(this.authService.uid, foodId);
    this.favFoods.splice(index, 1);
  }

  openBottomSheet(food: Food): void {
    this.bottomSheet.open(MealInputComponent, {
      data: {
        userId: this.authService.uid,
        date: this.date,
        maxAmount: this.maxAmount,
        minAmount: this.minAmount,
        food,
      },
    });
  }

  getSelectedMeals() {
    this.mainShellService.selectedMeals.subscribe((v) => {
      this.selectedMealsNum = v?.length;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
