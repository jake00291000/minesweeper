(() => {
    let clicked
    let gameOver
    let mineField
    let startTime
    let timeInterval

    let elementTimer
    let elementMinefield
    let elementDifficulty
    
    let difficulty
    let difficulties

    difficulties = {
        1: {
            size: 10,
            mines: 10
        },
        2: {
            size: 15,
            mines: 40
        },
        3: {
            size: 20,
            mines: 80
        }
    }

    difficulty = difficulties[1]

    document.addEventListener("DOMContentLoaded", init)

    function init () {
        setGlobalElements()

        registerListeners()

        resetDifficulty()

        drawBoard()
    }

    function setGlobalElements () {
        elementTimer = document.getElementById('timer')

        elementMinefield = document.getElementById('minefield')

        elementDifficulty = document.getElementById('difficulty')
    }

    function registerListeners () {
        elementMinefield.addEventListener('click', onTileClick)

        elementMinefield.addEventListener('mousedown', onTileMiddleMouseClick)

        elementMinefield.addEventListener('contextmenu', onTileRightClick)

        elementDifficulty.addEventListener('change', onDifficultyChange)
    }

    function resetDifficulty () {
        elementDifficulty.value = '1'
    }

    function drawBoard () {
        resetGameState()

        while (elementMinefield.lastChild) {
            elementMinefield.removeChild(elementMinefield.lastChild)
        }

        const minePositions = getMinePositions()

        for (let i = 0; i < difficulty.size; i++) {
            const rowDiv = document.createElement('div')

            rowDiv.classList.add('row')

            mineField[i] = []

            for (let j = 0; j < difficulty.size; j++) {
                const tileDiv = document.createElement('div')

                tileDiv.classList.add('tile')

                tileDiv.setAttribute('data-position', `${ i }-${ j }`)

                rowDiv.appendChild(tileDiv)

                const hasMine = minePositions[i].has(j)

                const tile = {
                    x: i,
                    y: j,
                    mine: hasMine,
                    unknown: true
                }

                mineField[i].push(tile)
            }

            elementMinefield.appendChild(rowDiv)
        }
    }

    function resetGameState () {
        gameOver = false

        clicked = false

        mineField = {}
    }

    function getMinePositions () {
        const seen = {}

        for (let i = 0; i < difficulty.size; i++) {
            seen[i] = new Set()
        }

        let mines = 0

        while (mines < difficulty.mines) {
            const x = getRandomPosition()
            const y = getRandomPosition()

            const row = seen[x]

            const hasY = row.has(y)

            if (!hasY) {
                row.add(y)

                mines += 1
            }
        }

        return seen
    }

    function getRandomPosition () {
        return Math.floor(Math.random() * (difficulty.size - 1))
    }

    function onTileClick (event, tile) {
        const allowed = allowClick(event)

        if (!allowed && !tile) return

        if (!tile) {
            tile = getTile(event)
        }

        if (tile.flagged) return

        if (tile.mine && clicked) {
            youLost(tile)

            return
        }

        const tiles = getTiles(tile)

        let numberOfMines = 0

        for (const tile of tiles) {
            if (tile.mine) numberOfMines += 1
        }

        if (!clicked) {
            if (numberOfMines) {
                moveMines(tiles, numberOfMines)
            }

            startTimer()
        }

        if (numberOfMines && clicked) {
            delete tile.unknown

            revealTile(tile, numberOfMines)
        } else {
            revealTiles(tiles)
        }

        clicked = true

        checkForWin()
    }

    function allowClick (event, isRightClick) {
        const isTile = event.target.classList.contains('tile')

        if (isRightClick && !clicked) {
            return false
        }

        return isTile && !gameOver
    }

    function getTile (event) {
        const position = event.target.getAttribute('data-position')

        const positions = position.split('-')

        const x = Number(positions[0])

        const y = Number(positions[1])

        const tile = mineField[ x ] [ y ]

        return tile
    }

    function onTileMiddleMouseClick (event) {
        if (event.button !== 1) return

        event.preventDefault()

        const tile = getTile(event)

        const tiles = getTiles(tile)

        const mine = tiles.find(t => t.mine && !t.flagged)

        if (mine) {
            onTileClick(event, mine)

            return
        }

        for (const tile of tiles) {
            onTileClick(event, tile)
        }
    }

    async function youLost (firstMine) {
        gameOver = true

        endTimer()

        const mines = [ firstMine ]

        for (const key in mineField) {
            const row = mineField[key]

            for (const tile of row) {
                const sameAsFirst = tile.x === firstMine.x && tile.y === firstMine.y

                if (!tile.flagged && tile.mine && !sameAsFirst) {
                    mines.push(tile)
                }
            }
        }

        for (const mine of mines) {
            const mineElement = document.querySelector(`[data-position='${ mine.x }-${ mine.y }']`)

            mineElement.classList.add('mine')

            const img = document.createElement('img')

            const randomImage = getRandomImage()

            img.setAttribute('src', randomImage)

            img.classList.add('meow')

            document.body.appendChild(img)

            new Audio('sound/boom.wav').play()

            await new Promise(r => setTimeout(r, 2000))
        }

        deleteImagery()
    }

    function getRandomImage () {
        const images = [
            'img/bird.png',
            'img/bread.jpg',
            'img/bulb.png',
            'img/cat.png',
            'img/christmas.jpg',
            'img/doghuh.png',
            'img/ehrm.png',
            'img/eyes.jpg',
            'img/gabe.jpg',
            'img/gulp.png',
            'img/HUH.png',
            'img/karissa.png',
            'img/lay.png',
            'img/logan.jpg',
            'img/lol.jpg',
            'img/lol.png',
            'img/popeyes.png',
            'img/shotgun.jpg',
            'img/smile.jpg',
            'img/sponge.png',
            'img/walter.png',
            'img/WHAT.jpg'
        ]

        const index = Math.floor(Math.random() * images.length)

        return images[index]
    }

    function getRandomSound () {
        const sounds = [
            'sound/boom.wav'
        ]

        const index = Math.floor(Math.random() * sounds.length)

        return sounds[index]
    }

    function getTiles (tile) {
        const tiles = []

        const rowIndices = [ tile.x - 1, tile.x, tile.x + 1 ]

        const tileIndices = [ tile.y - 1, tile.y, tile.y + 1 ]

        for (const rowIndex of rowIndices) {
            const row = mineField[rowIndex]

            if (!row) continue

            for (const tileIndex of tileIndices) {
                const tile = row[tileIndex]

                if (!tile?.unknown) continue

                tiles.push(tile)
            }
        }

        return tiles
    }

    function moveMines (tiles, numberOfMines) {
        const ignorePositions = {}

        for (const tile of tiles) {
            tile.mine = false

            if (tile.x in ignorePositions) {
                ignorePositions[tile.x].add(tile.y)

                continue
            }

            ignorePositions[tile.x] = new Set([ tile.y ])
        }

        let movedMines = 0

        while (movedMines < numberOfMines) {
            const x = getRandomPosition()
            const y = getRandomPosition()

            const ignore = ignorePositions[x]?.has(y)

            const tile = mineField[ x ][ y ]

            if (ignore || tile.mine) continue

            tile.mine = true

            movedMines += 1
        }
    }

    function revealTile (tile, numberOfMines) {
        const tileElement = document.querySelector(`[data-position='${ tile.x }-${ tile.y }']`)

        tileElement.classList.add('revealed')

        if (numberOfMines) {
            const span = document.createElement('span')

            span.innerText = numberOfMines

            tileElement.appendChild(span)
        }
    }

    function revealTiles (tiles) {
        for (const tile of tiles) {
            delete tile.unknown

            const surroundingTiles = getTiles(tile)

            let numberOfMines = 0

            for (const surroundingTile of surroundingTiles) {
                if (surroundingTile.mine) numberOfMines += 1
            }

            if (numberOfMines) {
                revealTile(tile, numberOfMines)

                continue
            }

            revealTile(tile)

            revealTiles(surroundingTiles)
        }
    }

    function startTimer () {
        startTime = Date.now()

        if (timeInterval) {
            endTimer()
        }

        timeInterval = setInterval(updateTime, 100)
    }

    function endTimer () {
        clearInterval(timeInterval)
    }

    function updateTime () {
        const elapsedTime = Date.now() - startTime

        const formattedTime = (elapsedTime / 1000).toFixed(1)

        elementTimer.innerText = formattedTime
    }

    function checkForWin () {
        for (const key in mineField) {
            const row = mineField[key]

            for (const tile of row) {
                if (tile.unknown && !tile.mine) return
            }
        }

        youWon()
    }

    async function youWon () {
        gameOver = true

        endTimer()

        const img = document.createElement('img')

        img.setAttribute('src', 'img/snoop.gif')

        img.classList.add('snoop')

        document.body.appendChild(img)

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        await new Promise(r => setTimeout(r, 200))

        new Audio('sound/airhorn.wav').play()

        setTimeout(() => {
            deleteImagery()
        }, 3000)
    }

    function deleteImagery () {
        const snoops = document.querySelectorAll('.snoop')

        const cats = document.querySelectorAll('.meow')

        const images = [ ...snoops, ...cats ]

        for (const image of images) {
            document.body.removeChild(image)
        }
    }

    function onTileRightClick (event) {
        event.preventDefault()

        const allowed = allowClick(event, true)

        if (!allowed) return

        const tile = getTile(event)

        if (!tile.unknown) return

        tile.flagged = !tile.flagged

        if (!tile.flagged) {
            event.target.removeChild(event.target.firstChild)

            return
        }

        const span = document.createElement('span')

        span.innerText = '🚩'

        event.target.appendChild(span)
    }

    function onDifficultyChange (event) {
        const difficultyLevel = Number(event.target.value)

        difficulty = difficulties[difficultyLevel]

        drawBoard()
    }
})()
