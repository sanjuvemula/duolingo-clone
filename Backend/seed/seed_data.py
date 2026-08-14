"""
Seed script — wipes and repopulates the SQLite DB with demo content.

Run from the Backend/ directory (same cwd requirement as uvicorn, since
connection.py points at the relative path "./duolingo.db"):

    python seed/seed_data.py

Content shape: one Korean course, 4 units, 4 skills per unit, 2 lessons per
skill, and 5 exercises per lesson — one of each exercise type, so every lesson
exercises all five code paths in the player. That totals 16 skills, 32 lessons
and 160 exercises.

Course content is declared as plain data in COURSE below and expanded into ORM
rows by build_course(), rather than written out as 80 hand-rolled Exercise(...)
calls. Adding a lesson means adding a dict entry, not copy-pasting constructor
boilerplate.

Text is Hangul (Korean script), stored and read as plain UTF-8 strings —
SQLite, FastAPI and Next.js all default to UTF-8, so no special handling is
needed anywhere in the stack for this to round-trip correctly.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

# Allow running as `python seed/seed_data.py` (script, not a package) by
# putting Backend/ on sys.path so `import app...` resolves.
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database.base import Base
from app.database.connection import engine, SessionLocal
from app.services import user_service
from app.models.models import (
    AppMeta,
    User,
    Course,
    Unit,
    Skill,
    Lesson,
    Exercise,
    UserProgress,
)


# Bump this whenever the seed content or the schema changes in a way an
# already-deployed database can't serve — a new column, a new skill, reordered
# units. It is written into app_meta at seed time and compared at boot by
# seed_if_stale(), which is how a deployment knows to rebuild itself.
#
# This exists because there is no migration tool here (see the README): SQLite
# cannot add a column to an existing table via create_all, so shipping a schema
# change to a live disk would otherwise leave the API raising "no such column"
# on every request. Rebuilding is acceptable *only* because every row in this
# database is demo data that the seed script itself authored — there is no
# learner-authored content to lose. A real app would run Alembic here instead.
CONTENT_VERSION = "3"

CONTENT_VERSION_KEY = "content_version"


# ---------------------------------------------------------------------------
# Course content
# ---------------------------------------------------------------------------
# Each lesson is a list of exercises, and each exercise is a dict:
#   type            one of the five supported types
#   question        prompt shown above the exercise
#   options         choices/tiles/pairs; None for type_answer
#   answer          what check_answer compares against
#
# Exercise-type contract (mirrored in Frontend/src/lib/exercise.ts):
#   multiple_choice  options: list[str]            answer: str
#   word_bank        options: list[str] (tiles)    answer: str (the sentence)
#   match            options: list[[ko, en]]       answer: list[[ko, en]]
#   fill_blank       options: list[str]            answer: str
#   type_answer      options: None                 answer: str

def mc(question, options, answer):
    return {"type": "multiple_choice", "question": question, "options": options, "answer": answer}


def word_bank(question, tiles, answer):
    return {"type": "word_bank", "question": question, "options": tiles, "answer": answer}


def match(question, pairs):
    return {"type": "match", "question": question, "options": pairs, "answer": pairs}


def fill_blank(question, options, answer):
    return {"type": "fill_blank", "question": question, "options": options, "answer": answer}


def type_answer(question, answer):
    return {"type": "type_answer", "question": question, "options": None, "answer": answer}


COURSE = {
    "title": "Korean for English Speakers",
    "language": "Korean",
    "units": [
        {
            "title": "Basics",
            "skills": [
                {
                    "title": "Greetings",
                    "icon": "greeting",
                    "lessons": [
                        ("Greetings 1", [
                            mc("What does '안녕하세요' mean?", ["Hello", "Goodbye", "Thank you", "Sorry"], "Hello"),
                            word_bank("Build: 'Thank you very much'", ["정말", "감사합니다", "안녕", "주세요"], "정말 감사합니다"),
                            match("Match the Korean to its meaning", [["안녕하세요", "Hello"], ["안녕히 가세요", "Goodbye"], ["감사합니다", "Thank you"]]),
                            fill_blank("___, 저는 학생입니다.  (Hello, I am a student.)", ["안녕하세요", "감사합니다", "죄송합니다", "주세요"], "안녕하세요"),
                            type_answer("Type 'Sorry' in Korean", "죄송합니다"),
                        ]),
                        ("Greetings 2", [
                            mc("What does '만나서 반갑습니다' mean?", ["Nice to meet you", "See you later", "Excuse me", "Good night"], "Nice to meet you"),
                            word_bank("Build: 'Nice to meet you'", ["만나서", "반갑습니다", "감사합니다", "안녕히"], "만나서 반갑습니다"),
                            match("Match the Korean to its meaning", [["실례합니다", "Excuse me"], ["어떻게 지내세요?", "How are you?"], ["잘 자요", "Good night"]]),
                            fill_blank("___ 지내세요?  (How are you?)", ["어떻게", "언제", "어디", "누구"], "어떻게"),
                            type_answer("Type 'Yes' in Korean", "네"),
                        ]),
                    ],
                },
                {
                    "title": "Numbers",
                    "icon": "number",
                    "lessons": [
                        ("Numbers 1", [
                            mc("What does '셋' mean?", ["Three", "Two", "Four", "Ten"], "Three"),
                            word_bank("Build: 'one, two, three'", ["하나", "둘", "셋", "넷"], "하나 둘 셋"),
                            match("Match the number to its meaning", [["하나", "One"], ["둘", "Two"], ["여섯", "Six"]]),
                            fill_blank("사과 ___ 개 주세요.  (Five apples, please.)", ["다섯", "여섯", "일곱", "여덟"], "다섯"),
                            type_answer("Type 'Five' in native Korean numbers", "다섯"),
                        ]),
                        ("Numbers 2", [
                            mc("What does '열' mean?", ["Ten", "Nine", "Seven", "Eight"], "Ten"),
                            word_bank("Build: 'eight, nine, ten'", ["여덟", "아홉", "열", "일곱"], "여덟 아홉 열"),
                            match("Match the number to its meaning", [["일곱", "Seven"], ["아홉", "Nine"], ["열", "Ten"]]),
                            fill_blank("___ 시에 만나요.  (Let's meet at seven.)", ["일곱", "여섯", "여덟", "다섯"], "일곱"),
                            type_answer("Type 'Eight' in native Korean numbers", "여덟"),
                        ]),
                    ],
                },
                {
                    "title": "Introductions",
                    "icon": "chat",
                    "lessons": [
                        ("Introductions 1", [
                            mc("What does '이름' mean?", ["Name", "Country", "Teacher", "Student"], "Name"),
                            word_bank("Build: 'I am a student'", ["저는", "학생", "입니다", "선생님"], "저는 학생 입니다"),
                            match("Match the word to its meaning", [["이름", "Name"], ["학생", "Student"], ["선생님", "Teacher"]]),
                            fill_blank("___이 뭐예요?  (What is your name?)", ["이름", "나라", "학교", "가족"], "이름"),
                            type_answer("Type 'Student' in Korean", "학생"),
                        ]),
                        ("Introductions 2", [
                            mc("What does '나라' mean?", ["Country", "City", "Name", "House"], "Country"),
                            word_bank("Build: 'I am from Korea'", ["저는", "한국에서", "왔어요", "갔어요"], "저는 한국에서 왔어요"),
                            match("Match the word to its meaning", [["한국", "Korea"], ["나라", "Country"], ["친구", "Friend"]]),
                            fill_blank("저는 ___에서 왔어요.  (I am from Korea.)", ["한국", "학교", "이름", "친구"], "한국"),
                            type_answer("Type 'Friend' in Korean", "친구"),
                        ]),
                    ],
                },
                {
                    "title": "Basic Phrases",
                    "icon": "star",
                    "lessons": [
                        ("Basic Phrases 1", [
                            mc("What does '얼마예요?' mean?", ["How much is it?", "Where is it?", "What is it?", "Who is it?"], "How much is it?"),
                            word_bank("Build: 'Please give me water'", ["물", "주세요", "밥", "좋아요"], "물 주세요"),
                            match("Match the phrase to its meaning", [["네", "Yes"], ["아니요", "No"], ["몰라요", "I don't know"]]),
                            fill_blank("이거 ___?  (How much is this?)", ["얼마예요", "뭐예요", "어디예요", "누구예요"], "얼마예요"),
                            type_answer("Type 'No' in Korean", "아니요"),
                        ]),
                        ("Basic Phrases 2", [
                            mc("What does '좋아요' mean?", ["It's good", "It's bad", "It's big", "It's small"], "It's good"),
                            word_bank("Build: 'I don't know'", ["저는", "몰라요", "알아요", "좋아요"], "저는 몰라요"),
                            match("Match the phrase to its meaning", [["좋아요", "It's good"], ["알아요", "I know"], ["괜찮아요", "It's okay"]]),
                            fill_blank("정말 ___!  (It's really good!)", ["좋아요", "몰라요", "아니요", "주세요"], "좋아요"),
                            type_answer("Type 'It's okay' in Korean", "괜찮아요"),
                        ]),
                    ],
                },
            ],
        },
        {
            "title": "Food",
            "skills": [
                {
                    "title": "Food Words",
                    "icon": "food",
                    "lessons": [
                        ("Food 1", [
                            mc("What does '사과' mean?", ["Apple", "Bread", "Water", "Egg"], "Apple"),
                            word_bank("Build: 'Bread, please'", ["빵", "주세요", "물", "감사합니다"], "빵 주세요"),
                            match("Match the food to its meaning", [["물", "Water"], ["계란", "Egg"], ["우유", "Milk"]]),
                            fill_blank("저는 ___을 좋아해요.  (I like kimchi.)", ["김치", "사과", "빵", "우유"], "김치"),
                            type_answer("Type 'Bread' in Korean", "빵"),
                        ]),
                        ("Food 2", [
                            mc("What does '치즈' mean?", ["Cheese", "Rice", "Meat", "Fish"], "Cheese"),
                            word_bank("Build: 'I eat rice'", ["저는", "밥을", "먹어요", "마셔요"], "저는 밥을 먹어요"),
                            match("Match the food to its meaning", [["고기", "Meat"], ["생선", "Fish"], ["닭고기", "Chicken"]]),
                            fill_blank("___을 주세요.  (Rice, please.)", ["밥", "물", "빵", "고기"], "밥"),
                            type_answer("Type 'Fruit' in Korean", "과일"),
                        ]),
                    ],
                },
                {
                    "title": "Drinks",
                    "icon": "drink",
                    "lessons": [
                        ("Drinks 1", [
                            mc("What does '커피' mean?", ["Coffee", "Tea", "Juice", "Milk"], "Coffee"),
                            word_bank("Build: 'Water, please'", ["물", "주세요", "커피", "차"], "물 주세요"),
                            match("Match the drink to its meaning", [["커피", "Coffee"], ["차", "Tea"], ["주스", "Juice"]]),
                            fill_blank("___ 한 잔 주세요.  (One cup of coffee, please.)", ["커피", "빵", "밥", "생선"], "커피"),
                            type_answer("Type 'Tea' in Korean", "차"),
                        ]),
                        ("Drinks 2", [
                            mc("What does '마셔요' mean?", ["Drink", "Eat", "Sleep", "Study"], "Drink"),
                            word_bank("Build: 'I drink tea'", ["저는", "차를", "마셔요", "먹어요"], "저는 차를 마셔요"),
                            match("Match the word to its meaning", [["마셔요", "Drink"], ["먹어요", "Eat"], ["주세요", "Please give"]]),
                            fill_blank("주스를 ___.  (I drink juice.)", ["마셔요", "먹어요", "자요", "가요"], "마셔요"),
                            type_answer("Type 'Juice' in Korean", "주스"),
                        ]),
                    ],
                },
                {
                    "title": "Ordering",
                    "icon": "cart",
                    "lessons": [
                        ("Ordering 1", [
                            mc("What does '메뉴' mean?", ["Menu", "Bill", "Table", "Spoon"], "Menu"),
                            word_bank("Build: 'Please give me the menu'", ["메뉴", "주세요", "계산서", "물"], "메뉴 주세요"),
                            match("Match the word to its meaning", [["메뉴", "Menu"], ["계산서", "Bill"], ["식당", "Restaurant"]]),
                            fill_blank("___ 주세요.  (The bill, please.)", ["계산서", "메뉴", "커피", "빵"], "계산서"),
                            type_answer("Type 'Menu' in Korean", "메뉴"),
                        ]),
                        ("Ordering 2", [
                            mc("What does '맛있어요' mean?", ["It's delicious", "It's spicy", "It's cold", "It's cheap"], "It's delicious"),
                            word_bank("Build: 'It is really delicious'", ["정말", "맛있어요", "매워요", "비싸요"], "정말 맛있어요"),
                            match("Match the word to its meaning", [["맛있어요", "Delicious"], ["매워요", "Spicy"], ["짜요", "Salty"]]),
                            fill_blank("김치가 ___.  (Kimchi is spicy.)", ["매워요", "맛있어요", "짜요", "좋아요"], "매워요"),
                            type_answer("Type 'It's delicious' in Korean", "맛있어요"),
                        ]),
                    ],
                },
                {
                    "title": "Fruits & Veg",
                    "icon": "leaf",
                    "lessons": [
                        ("Fruits 1", [
                            mc("What does '딸기' mean?", ["Strawberry", "Grape", "Watermelon", "Carrot"], "Strawberry"),
                            word_bank("Build: 'I like strawberries'", ["저는", "딸기를", "좋아해요", "싫어해요"], "저는 딸기를 좋아해요"),
                            match("Match the fruit to its meaning", [["딸기", "Strawberry"], ["포도", "Grape"], ["수박", "Watermelon"]]),
                            fill_blank("___를 먹어요.  (I eat grapes.)", ["포도", "당근", "양파", "수박"], "포도"),
                            type_answer("Type 'Watermelon' in Korean", "수박"),
                        ]),
                        ("Vegetables 1", [
                            mc("What does '당근' mean?", ["Carrot", "Onion", "Potato", "Cabbage"], "Carrot"),
                            word_bank("Build: 'Carrots and onions'", ["당근", "그리고", "양파", "감자"], "당근 그리고 양파"),
                            match("Match the vegetable to its meaning", [["당근", "Carrot"], ["양파", "Onion"], ["감자", "Potato"]]),
                            fill_blank("___를 사요.  (I buy potatoes.)", ["감자", "딸기", "포도", "수박"], "감자"),
                            type_answer("Type 'Onion' in Korean", "양파"),
                        ]),
                    ],
                },
            ],
        },
        {
            "title": "Travel",
            "skills": [
                {
                    "title": "Places",
                    "icon": "map",
                    "lessons": [
                        ("Places 1", [
                            mc("What does '학교' mean?", ["School", "Hospital", "Bank", "Market"], "School"),
                            word_bank("Build: 'I go to school'", ["저는", "학교에", "가요", "집에"], "저는 학교에 가요"),
                            match("Match the place to its meaning", [["학교", "School"], ["집", "Home"], ["병원", "Hospital"]]),
                            fill_blank("___이 어디예요?  (Where is the restroom?)", ["화장실", "학교", "은행", "시장"], "화장실"),
                            type_answer("Type 'Home' in Korean", "집"),
                        ]),
                        ("Places 2", [
                            mc("What does '식당' mean?", ["Restaurant", "Airport", "Hotel", "Station"], "Restaurant"),
                            word_bank("Build: 'Where is the station?'", ["역이", "어디예요", "학교가", "주세요"], "역이 어디예요"),
                            match("Match the place to its meaning", [["공항", "Airport"], ["역", "Station"], ["호텔", "Hotel"]]),
                            fill_blank("___에서 밥을 먹어요.  (I eat at the restaurant.)", ["식당", "은행", "공항", "병원"], "식당"),
                            type_answer("Type 'Bank' in Korean", "은행"),
                        ]),
                    ],
                },
                {
                    "title": "Directions",
                    "icon": "compass",
                    "lessons": [
                        ("Directions 1", [
                            mc("What does '왼쪽' mean?", ["Left", "Right", "Front", "Behind"], "Left"),
                            word_bank("Build: 'Please go left'", ["왼쪽으로", "가세요", "오른쪽으로", "주세요"], "왼쪽으로 가세요"),
                            match("Match the direction to its meaning", [["왼쪽", "Left"], ["오른쪽", "Right"], ["앞", "Front"]]),
                            fill_blank("___으로 가세요.  (Please go right.)", ["오른쪽", "왼쪽", "여기", "거기"], "오른쪽"),
                            type_answer("Type 'Here' in Korean", "여기"),
                        ]),
                        ("Directions 2", [
                            mc("What does '뒤' mean?", ["Behind", "Above", "Below", "Here"], "Behind"),
                            word_bank("Build: 'It is here'", ["여기에", "있어요", "거기에", "가요"], "여기에 있어요"),
                            match("Match the direction to its meaning", [["위", "Above"], ["아래", "Below"], ["거기", "There"]]),
                            fill_blank("은행은 학교 ___에 있어요.  (The bank is behind the school.)", ["뒤", "앞", "위", "아래"], "뒤"),
                            type_answer("Type 'Straight ahead' in Korean", "직진"),
                        ]),
                    ],
                },
                {
                    "title": "Transport",
                    "icon": "bus",
                    "lessons": [
                        ("Transport 1", [
                            mc("What does '버스' mean?", ["Bus", "Subway", "Taxi", "Train"], "Bus"),
                            word_bank("Build: 'I ride the bus'", ["저는", "버스를", "타요", "걸어요"], "저는 버스를 타요"),
                            match("Match the transport to its meaning", [["버스", "Bus"], ["지하철", "Subway"], ["택시", "Taxi"]]),
                            fill_blank("___을 타고 가요.  (I go by subway.)", ["지하철", "자전거", "기차", "택시"], "지하철"),
                            type_answer("Type 'Taxi' in Korean", "택시"),
                        ]),
                        ("Transport 2", [
                            mc("What does '자전거' mean?", ["Bicycle", "Train", "Car", "Plane"], "Bicycle"),
                            word_bank("Build: 'The train is fast'", ["기차가", "빨라요", "느려요", "버스가"], "기차가 빨라요"),
                            match("Match the transport to its meaning", [["기차", "Train"], ["자전거", "Bicycle"], ["비행기", "Plane"]]),
                            fill_blank("___는 빨라요.  (The plane is fast.)", ["비행기", "자전거", "버스", "택시"], "비행기"),
                            type_answer("Type 'Train' in Korean", "기차"),
                        ]),
                    ],
                },
                {
                    "title": "Shopping",
                    "icon": "bag",
                    "lessons": [
                        ("Shopping 1", [
                            mc("What does '가게' mean?", ["Shop", "School", "Bank", "Station"], "Shop"),
                            word_bank("Build: 'I go to the shop'", ["저는", "가게에", "가요", "와요"], "저는 가게에 가요"),
                            match("Match the word to its meaning", [["가게", "Shop"], ["옷", "Clothes"], ["신발", "Shoes"]]),
                            fill_blank("___을 사요.  (I buy clothes.)", ["옷", "밥", "물", "책"], "옷"),
                            type_answer("Type 'Shoes' in Korean", "신발"),
                        ]),
                        ("Shopping 2", [
                            mc("What does '비싸요' mean?", ["It's expensive", "It's cheap", "It's big", "It's new"], "It's expensive"),
                            word_bank("Build: 'It is really cheap'", ["정말", "싸요", "비싸요", "좋아요"], "정말 싸요"),
                            match("Match the word to its meaning", [["비싸요", "Expensive"], ["싸요", "Cheap"], ["사요", "Buy"]]),
                            fill_blank("이 신발은 ___.  (These shoes are expensive.)", ["비싸요", "싸요", "좋아요", "매워요"], "비싸요"),
                            type_answer("Type 'It's cheap' in Korean", "싸요"),
                        ]),
                    ],
                },
            ],
        },
        {
            "title": "Family",
            "skills": [
                {
                    "title": "Family Words",
                    "icon": "family",
                    "lessons": [
                        ("Family 1", [
                            mc("What does '어머니' mean?", ["Mother", "Father", "Sister", "Brother"], "Mother"),
                            word_bank("Build: 'This is my mother'", ["이분은", "저의", "어머니입니다", "아버지입니다"], "이분은 저의 어머니입니다"),
                            match("Match the family word to its meaning", [["어머니", "Mother"], ["아버지", "Father"], ["가족", "Family"]]),
                            fill_blank("저의 ___는 의사예요.  (My father is a doctor.)", ["아버지", "어머니", "동생", "딸"], "아버지"),
                            type_answer("Type 'Family' in Korean", "가족"),
                        ]),
                        ("Family 2", [
                            mc("What does '동생' mean?", ["Younger sibling", "Grandmother", "Son", "Daughter"], "Younger sibling"),
                            word_bank("Build: 'I have a younger sibling'", ["저는", "동생이", "있어요", "없어요"], "저는 동생이 있어요"),
                            match("Match the family word to its meaning", [["할머니", "Grandmother"], ["아들", "Son"], ["딸", "Daughter"]]),
                            fill_blank("___는 집에 계세요.  (Grandfather is at home.)", ["할아버지", "할머니", "아들", "동생"], "할아버지"),
                            type_answer("Type 'Daughter' in Korean", "딸"),
                        ]),
                    ],
                },
                {
                    "title": "Daily Life",
                    "icon": "sun",
                    "lessons": [
                        ("Daily Life 1", [
                            mc("What does '아침' mean?", ["Morning", "Evening", "Today", "Tomorrow"], "Morning"),
                            word_bank("Build: 'I study Korean'", ["저는", "한국어를", "공부해요", "먹어요"], "저는 한국어를 공부해요"),
                            match("Match the word to its meaning", [["아침", "Morning"], ["저녁", "Evening"], ["오늘", "Today"]]),
                            fill_blank("___ 학교에 가요.  (I go to school tomorrow.)", ["내일", "어제", "오늘", "아침"], "내일"),
                            type_answer("Type 'Today' in Korean", "오늘"),
                        ]),
                        ("Daily Life 2", [
                            mc("What does '자요' mean?", ["Sleep", "Work", "Study", "Read"], "Sleep"),
                            word_bank("Build: 'I sleep at home'", ["저는", "집에서", "자요", "일해요"], "저는 집에서 자요"),
                            match("Match the verb to its meaning", [["일해요", "Work"], ["공부해요", "Study"], ["자요", "Sleep"]]),
                            fill_blank("저는 매일 ___.  (I work every day.)", ["일해요", "자요", "먹어요", "가요"], "일해요"),
                            type_answer("Type 'Yesterday' in Korean", "어제"),
                        ]),
                    ],
                },
                {
                    "title": "Time",
                    "icon": "clock",
                    "lessons": [
                        ("Time 1", [
                            mc("What does '시간' mean?", ["Time", "Minute", "Weekend", "Week"], "Time"),
                            word_bank("Build: 'I have no time'", ["저는", "시간이", "없어요", "있어요"], "저는 시간이 없어요"),
                            match("Match the word to its meaning", [["시간", "Time"], ["분", "Minute"], ["주말", "Weekend"]]),
                            fill_blank("십 ___ 기다리세요.  (Please wait ten minutes.)", ["분", "시간", "주말", "오전"], "분"),
                            type_answer("Type 'Weekend' in Korean", "주말"),
                        ]),
                        ("Time 2", [
                            mc("What does '오후' mean?", ["Afternoon", "Morning", "Night", "Week"], "Afternoon"),
                            word_bank("Build: 'See you in the afternoon'", ["오후에", "만나요", "오전에", "가요"], "오후에 만나요"),
                            match("Match the word to its meaning", [["오전", "Morning (AM)"], ["오후", "Afternoon (PM)"], ["밤", "Night"]]),
                            fill_blank("___에 학교에 가요.  (I go to school in the morning.)", ["오전", "오후", "밤", "주말"], "오전"),
                            type_answer("Type 'Night' in Korean", "밤"),
                        ]),
                    ],
                },
                {
                    "title": "Describing People",
                    "icon": "people",
                    "lessons": [
                        ("Describing 1", [
                            mc("What does '예뻐요' mean?", ["Pretty", "Tall", "Kind", "Smart"], "Pretty"),
                            word_bank("Build: 'My friend is kind'", ["제", "친구는", "친절해요", "똑똑해요"], "제 친구는 친절해요"),
                            match("Match the word to its meaning", [["예뻐요", "Pretty"], ["친절해요", "Kind"], ["똑똑해요", "Smart"]]),
                            fill_blank("어머니는 정말 ___.  (Mother is really kind.)", ["친절해요", "작아요", "비싸요", "매워요"], "친절해요"),
                            type_answer("Type 'Smart' in Korean", "똑똑해요"),
                        ]),
                        ("Describing 2", [
                            mc("What does '키가 커요' mean?", ["Tall", "Short", "Small", "Big"], "Tall"),
                            word_bank("Build: 'My older brother is tall'", ["형은", "키가", "커요", "작아요"], "형은 키가 커요"),
                            match("Match the word to its meaning", [["커요", "Big"], ["작아요", "Small"], ["많아요", "Many"]]),
                            fill_blank("동생은 키가 ___.  (My younger sibling is short.)", ["작아요", "커요", "많아요", "좋아요"], "작아요"),
                            type_answer("Type 'Big' in Korean", "커요"),
                        ]),
                    ],
                },
            ],
        },
    ],
}

# Rivals sharing the demo learner's league, so the weekly board is populated
# and the learner sits mid-table with people to catch and people catching them.
# (name, email, xp_total, streak, gems, week_xp)
#
# week_xp is what the league ranks on. These are chosen so the demo user's 90
# lands 4th of 8 — just outside the top-3 promotion zone, which is the most
# motivating place to look at a leaderboard from, and shows both the promotion
# and relegation bands at once.
LEADERBOARD_USERS = [
    ("Min-jun Park", "minjun@example.com", 480, 12, 45, 210),
    ("Soo-ah Kim", "sooah@example.com", 350, 7, 30, 160),
    ("Ji-hoon Lee", "jihoon@example.com", 210, 3, 15, 120),
    ("Ha-eun Choi", "haeun@example.com", 120, 5, 20, 70),
    ("Yuna Kang", "yuna@example.com", 60, 1, 5, 40),
    ("Tae-yang Seo", "taeyang@example.com", 95, 2, 10, 25),
    ("Bo-ram Jung", "boram@example.com", 40, 0, 0, 0),
]

DEMO_LEAGUE = "gold"


def rebuild_schema() -> None:
    """Drop every table and recreate it from the current models.

    Deleting rows would be enough to re-seed content, but it would not pick up
    model changes — SQLite can't add a column to an existing table via
    create_all, so a schema edit would leave a stale DB that fails at runtime.
    Since there is no migration tool in this project and the DB is disposable
    demo data (duolingo.db is gitignored and rebuilt by this script), dropping
    is the honest way to keep schema and models in sync.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def build_course(db) -> tuple[Course, list[Skill], int, int]:
    """Expand the COURSE data table into ORM rows.

    Returns the course, its skills in tree order (needed to decide which one
    starts unlocked), and lesson/exercise counts for the summary print.
    """
    course = Course(title=COURSE["title"], language=COURSE["language"])
    db.add(course)
    db.flush()  # assigns course.id without committing yet

    ordered_skills: list[Skill] = []
    lesson_count = 0
    exercise_count = 0

    for unit_order, unit_data in enumerate(COURSE["units"], start=1):
        unit = Unit(title=unit_data["title"], order=unit_order, course_id=course.id)
        db.add(unit)
        db.flush()

        for skill_order, skill_data in enumerate(unit_data["skills"], start=1):
            skill = Skill(
                title=skill_data["title"],
                icon=skill_data.get("icon", "star"),
                order=skill_order,
                unit_id=unit.id,
            )
            db.add(skill)
            db.flush()
            ordered_skills.append(skill)

            for lesson_order, (lesson_title, exercises) in enumerate(skill_data["lessons"], start=1):
                lesson = Lesson(title=lesson_title, order=lesson_order, skill_id=skill.id)
                db.add(lesson)
                db.flush()
                lesson_count += 1

                for exercise_order, spec in enumerate(exercises, start=1):
                    db.add(Exercise(
                        lesson_id=lesson.id,
                        order=exercise_order,
                        type=spec["type"],
                        question=spec["question"],
                        options=spec["options"],
                        correct_answer=spec["answer"],
                    ))
                    exercise_count += 1

    return course, ordered_skills, lesson_count, exercise_count


def seed() -> None:
    rebuild_schema()
    db = SessionLocal()

    try:
        course, ordered_skills, lesson_count, exercise_count = build_course(db)

        # --- Sample learner ------------------------------------------------
        # Seeded mid-course rather than empty, so the app is immediately
        # interesting: the tree shows a completed, an available and several
        # locked skills at once, and the daily goal is partly filled.
        # Gems are mocked (never earned, only spent on heart refills) but
        # seeded generously so a reviewer can exercise the refill flow.
        week_start = user_service.current_week_start()

        user = User(
            name="Demo User",
            email="demo@example.com",
            xp_total=140,
            xp_today=30,
            xp_today_date=datetime.utcnow(),
            week_xp=90,
            week_start=week_start,
            league=DEMO_LEAGUE,
            hearts=4,
            streak=3,
            last_active_date=datetime.utcnow(),
            gems=500,
            avatar_color="blue",
            # Backdated so the profile's "Joined" line reads as a real history
            # rather than "joined today" on every fresh seed.
            created_at=datetime.utcnow() - timedelta(days=96),
            top_3_finishes=2,
        )
        db.add(user)
        db.flush()

        db.add_all([
            User(
                name=name,
                email=email,
                xp_total=xp,
                hearts=5,
                streak=streak,
                gems=gems,
                week_xp=week_xp,
                week_start=week_start,
                league=DEMO_LEAGUE,
            )
            for name, email, xp, streak, gems, week_xp in LEADERBOARD_USERS
        ])

        # --- Progress ------------------------------------------------------
        # First skill fully completed, second in progress, rest locked. This
        # mirrors what progress_service would have produced had the learner
        # actually played, and renders all three node states on first load
        # instead of everything being either all-locked or all-open.
        def seeded_progress(index: int, skill: Skill) -> UserProgress:
            lesson_count = len(skill.lessons)
            if index == 0:
                return UserProgress(user_id=user.id, skill_id=skill.id,
                                    status="completed", crowns=lesson_count)
            if index == 1:
                # One of two lessons done — gives the progress ring a real
                # partial fraction to draw, not just full or empty.
                return UserProgress(user_id=user.id, skill_id=skill.id,
                                    status="available", crowns=1)
            return UserProgress(user_id=user.id, skill_id=skill.id,
                                status="locked", crowns=0)

        db.add_all([
            seeded_progress(index, skill)
            for index, skill in enumerate(ordered_skills)
        ])

        # Stamp the version last, inside the same transaction as the content it
        # describes. If seeding fails halfway the stamp rolls back with it, so
        # the next boot sees a stale version and retries rather than trusting a
        # half-built database.
        db.add(AppMeta(key=CONTENT_VERSION_KEY, value=CONTENT_VERSION))

        db.commit()

        print("Seed complete:")
        print(
            f"  1 course, {len(COURSE['units'])} units, {len(ordered_skills)} skills, "
            f"{lesson_count} lessons, {exercise_count} exercises"
        )
        print(f"  {1 + len(LEADERBOARD_USERS)} users (1 learner + {len(LEADERBOARD_USERS)} leaderboard)")
        print(
            f"  learner -> id={user.id}, email={user.email}, "
            f"{user.xp_total} XP, {user.streak}-day streak, "
            "skill 1 completed / skill 2 in progress"
        )

    finally:
        db.close()


def stored_content_version() -> tuple[bool, str | None]:
    """Inspect the database's seeded state.

    Returns (has_content, version). The two are separate because "empty" and
    "seeded by a build that predates app_meta" both lack a version but are not
    the same situation — the second is an already-deployed disk, and reporting
    it as empty would make the boot log claim it found nothing when it is in
    fact about to discard real content. Both still count as stale.
    """
    Base.metadata.create_all(bind=engine)  # tables must exist before querying

    db = SessionLocal()
    try:
        has_content = db.query(Course).first() is not None
        if not has_content:
            return False, None
        row = db.query(AppMeta).filter(AppMeta.key == CONTENT_VERSION_KEY).first()
        return True, (row.value if row else None)
    finally:
        db.close()


def seed_if_stale() -> bool:
    """Seed when the database is empty or was built from older content.
    Returns whether it ran.

    This is what a deployment's start command uses, and it has to serve two
    cases that pull in opposite directions:

      * A container restart must NOT reseed. Restarts happen for reasons that
        have nothing to do with a release, and dropping every table on each one
        would wipe whatever the learner had done since the last boot.
      * A release that changes the schema or the seed content MUST reseed.
        SQLite can't add a column to an existing table via create_all, so a new
        column against an old disk means every query raises "no such column"
        until the database is rebuilt.

    Comparing the stamped version against CONTENT_VERSION separates the two:
    restarts see a matching version and do nothing, while the first boot after
    a version bump rebuilds once and stamps the new value.

    The cost is that a rebuild resets the demo learner. That is acceptable here
    only because every row is demo data this script authored — see the note on
    CONTENT_VERSION.
    """
    has_content, stored = stored_content_version()

    if stored == CONTENT_VERSION:
        print(f"Database already at content version {CONTENT_VERSION} — skipping seed.")
        return False

    if not has_content:
        print(f"Empty database — seeding content version {CONTENT_VERSION}.")
    elif stored is None:
        print(
            "Database has content but no version stamp (seeded before app_meta "
            f"existed) — rebuilding at content version {CONTENT_VERSION}."
        )
    else:
        print(f"Content version {stored} is stale (code expects {CONTENT_VERSION}) — reseeding.")

    seed()
    return True


if __name__ == "__main__":
    # --if-stale is for deployments (safe to run on every boot); the bare form
    # is for local development, where a full rebuild is usually what you want.
    if "--if-stale" in sys.argv:
        seed_if_stale()
    else:
        seed()
