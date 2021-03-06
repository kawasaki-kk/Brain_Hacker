# -*- coding: utf-8 -*-
"""
褒める台詞の種類をpraisesに書いておく
発想の転換を促す文はproposalsに書いておく
"""

praises = (
    '{0}はとても良さそうなアイディアにゃ。',
    '{0}は素晴らしいアイディアにゃ。',
    '{0}は面白いアイディアにゃ。',
    '{0}というアイディアを出すとはさすがだにゃ。',
    '{0}はセンスのあるアイディアにゃ。',
    'わかっていても{0}はなかなか出てこないにゃ。さすがだにゃ。',
    '{0}は今までで一番いいアイディアにゃ。',
)

proposals = {
    # 転用
    0: '{0}は今のままで新しい使い道はないかにゃ？',
    1: '{0}を少し変えて他の使い道はないかにゃ？',
    # 応用
    10: '{0}に似たものはないかにゃ？',
    11: '{0}の他に似たアイデアはないかにゃ？',
    12: '{0}の一部を借りたらどうかにゃ？',
    # 拡大
    20: '{0}に何か加えてみたらどうかにゃ？',
    21: '{0}の数をもっと多くしてみたらどうかにゃ？',
    # 縮小
    30: '{0}をもっと細かくして考えてみたらどうかにゃ？',
    31: '{0}をやめたらどうかにゃ？',
    # 変更
    40: '{0}の形式を変えてみたらどうかにゃ？',
    41: '{0}の意味を変えてみたらどうかにゃ？',
    # 代用
    50: '{0}を他の材料にしてみたらどうかにゃ？',
    51: '{0}を他の人にしてみたらどうかにゃ？',
    # 置換
    60: '{0}を他の順序にしてみたらどうかにゃ？',
    61: '{0}の原因と結果を入れ換えてみたらどうかにゃ？',
    # 逆転
    70: '{0}を役割を逆にして考えてみたらどうかにゃ？',
    71: '{0}を立場を変えて考えてみたらどうかにゃ？',
    # 結合
    80: '{0}の目的を結合してみたらどうかにゃ？',
    81: '{0}と何かのアイデアを組み合わせてみたらどうかにゃ？',
}

named_entity_type = {   # Example
    'ART': '人工物名',  # ドラえもん、レクサス
    'ORG': '組織名',    # NTT
    'PSN': '人名',      # 鈴木
    'LOC': '地名',      # 横浜
    'DAT': '日付表現',  # きょう
    'TIM': '時刻表現',  # 9時30分
}

available_answer = {
    'ART': [0, 1, 10, 11, 12, 20, 21, 30, 41, 50, 81],
    'ORG': [10, 11, 20, 30, 41, 70, 71, 81],
    'PSN': [10, 11, 20, 21, 41, 51, 70, 71, 81],
    'LOC': [10, 11, 20, 30, 41, 81],
    'DAT': [20, 30, 40, 41, 60, 81],
    'TIM': [20, 40, 41, 60, 81],
}
