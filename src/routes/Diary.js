import { React, useState, useRef, useEffect, useContext } from 'react'

import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";
import "./override-styles.css";
import "react-datepicker/dist/react-datepicker.css";

import DiaryTopBar from '../components/DiaryTopBar';
import DatePicker from 'react-datepicker';
import { AiOutlineRight, AiOutlineLeft, AiTwotonePlayCircle } from 'react-icons/ai'

import { UserContext } from '../contexts/user.context';
import { DiaryManager } from '../utils/diaryManager';
import { date2Str, offsetDate, isToday, date2IsoStr } from '../utils/common.utils';


const SAVE_DIARY_COOLDOWN = 1000;
const diaryManager = new DiaryManager();

const getEasyMde = (parentDom) => {
  return new EasyMDE({
    element: parentDom,  // will be sibling of editorDom, child of containerDom
    autofocus: true,
    toolbar: false,
    spellChecker: false,
    placeholder: '# Write something ...',
  });
}

export default function Diary() {

  const { userData } = useContext(UserContext);

  const fetchedDiary = useRef(null);  // stage newly fetched diary before render it to editor
  const editor = useRef(null);
  const canChangeDate = useRef(true);  // debounce switching diary

  const [currDate, setCurrDate] = useState(new Date());
  const [displayedDate, setDisplayedDate] = useState(new Date());  // will align with currDate when diary is fetched
  const [animationClass, setAnimationClass] = useState('');
  const [saved, setSaved] = useState(true);

  // set content or just title if content is empty
  const displayDiaryContent = (date, data) => {
    console.log('display diary', date2Str(date), data)
    setDisplayedDate(date);
    if (data) {
      editor.current.value(data.content);
    }
    else {
      editor.current.value('');
    }
  }

  const timer = useRef(null);
  const triggerAutoSave = async (date, text, force = false) => {
    if (text === null) return;
    if (!force) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await diaryManager.saveDiary(date, text);
      setSaved(true);
    }, SAVE_DIARY_COOLDOWN);
  }

  // force save diary for currDate before date changes
  const changeDate = async (newDate) => {
    if (!canChangeDate || !editor.current || !userData) return;
    canChangeDate.current = false;
    triggerAutoSave(currDate, editor.current.value(), true);
    setCurrDate(newDate);
  }

  // on mounted
  useEffect(() => {
    // create editor dom ele
    const containerDom = document.getElementById('editor-container');
    const editorDom = document.createElement('textarea');
    containerDom.append(editorDom);
    editor.current = getEasyMde(editorDom);

    return () => {  // remove everything in container
      containerDom.innerHTML = '';
    }
  }, []);

  // on current date change
  useEffect(() => {
    if (userData)
      diaryManager.setUser(userData.userDocRef);

    if (!userData || !editor.current) return;

    // triggerAutoSave depends on userData, editor and currDate
    // need to re-bind onchange event every time the dependancy changes, see:
    // https://stackoverflow.com/questions/53845595/wrong-react-hooks-behaviour-with-event-listener
    const onChangeHandler = (cm, delta) => {
      setSaved(false);
      triggerAutoSave(currDate, cm.getValue());
    }
    const onRenderLineHandler = (cm, line, ele) => { }
    editor.current.codemirror.on('change', onChangeHandler);
    editor.current.codemirror.on('renderLine', onRenderLineHandler);

    // fetch new diary and fadeout
    fetchedDiary.current = diaryManager.fetchDiary(currDate);
    setAnimationClass('fade-out');

    return () => {
      editor.current.codemirror.off('change', onChangeHandler);
    }
  }, [userData, currDate])

  // on editor faded out
  const editorFadeOutAnimationEndHandler = async (e) => {
    if (e.animationName !== 'fade-out') return;
    const data = await fetchedDiary.current;  // wait until diary is fetched
    displayDiaryContent(currDate, data);
    setAnimationClass('fade-in');
    canChangeDate.current = true;
  }

  return (
    <>
      <DiaryTopBar date={displayedDate} saved={saved} />

      <div className="relative pt-4 px-6 overflow-x-hidden">
        <div className="flex flex-col items-center overflow-hidden">

          <div className={`w-full md:max-w-2xl -z-0 ${animationClass}`}
            onAnimationEnd={editorFadeOutAnimationEndHandler}>
            <div className='flex sm:justify-start justify-center items-center'>
              <AiOutlineLeft onClick={() => changeDate(offsetDate(currDate, -1))}
                className='flex-shrink-0 text-gray-300 w-10 h-10 p-2 cursor-pointer rounded-full hover:bg-gray-100' />

              <div>
                <DatePicker
                  onChange={(date) => changeDate(date)}
                  selected={currDate}
                  todayButton='Today'
                  customInput={
                    <div className='flex justify-center items-center cursor-pointer 
                    w-56 text-center px-2 py-4 rounded-lg hover:bg-gray-100 text-4xl flex-shrink-0'>
                      {
                        isToday(displayedDate) ?
                          <AiTwotonePlayCircle size='10' className='text-clr-highlight mr-2' /> : null
                      }
                      <h1>{date2Str(displayedDate)}</h1>
                    </div>
                  } />
              </div>

              <AiOutlineRight onClick={() => changeDate(offsetDate(currDate, 1))}
                className='flex-shrink-0 text-gray-300 w-10 h-10 p-2 cursor-pointer rounded-full hover:bg-gray-100' />
            </div>

            <div id="editor-container"></div>

          </div>

        </div>
      </div >
    </>
  )
}